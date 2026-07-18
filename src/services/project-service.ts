import { db } from '@/db/database'
import { createProject } from '@/models/project'
import { createNarrator } from '@/models/narrator'
import { createConsent } from '@/models/consent'
import { projectRepository } from '@/repositories/project-repository'
import { narratorRepository } from '@/repositories/narrator-repository'
import { consentRepository } from '@/repositories/consent-repository'
import { interviewSessionRepository } from '@/repositories/interview-session-repository'
import type { Project } from '@/models/project'
import type { Narrator } from '@/models/narrator'
import type { Consent } from '@/models/consent'
import type { InterviewSession } from '@/models/interview-session'

export interface CreateProjectInput {
  projectTitle: string
  projectDescription: string
  narratorName: string
  narratorRelationship: string
  narratorBirthYear: number | null
  narratorNotes: string
  consent: Omit<Consent, 'id' | 'projectId' | 'createdAt' | 'updatedAt'>
}

export interface ProjectDetail {
  project: Project
  narrator: Narrator
  consent: Consent
  interviews: InterviewSession[]
}

export const projectService = {
  async createProject(input: CreateProjectInput): Promise<ProjectDetail> {
    const project = createProject({
      title: input.projectTitle,
      description: input.projectDescription,
      narratorId: '', // placeholder, will be replaced after narrator creation
    })

    const narrator = createNarrator({
      projectId: project.id,
      name: input.narratorName,
      relationshipToInterviewer: input.narratorRelationship,
      birthYear: input.narratorBirthYear,
      notes: input.narratorNotes,
    })

    project.narratorId = narrator.id

    const consent = createConsent({
      projectId: project.id,
      consentToRecord: input.consent.consentToRecord,
      consentToStoreQuotes: input.consent.consentToStoreQuotes,
      consentToStorePhotos: input.consent.consentToStorePhotos,
      consentToFamilyView: input.consent.consentToFamilyView,
      consentToPublicDisplay: input.consent.consentToPublicDisplay,
      confirmedAt: input.consent.confirmedAt,
      confirmationMethod: input.consent.confirmationMethod,
      notes: input.consent.notes,
    })

    // All in one transaction - atomic write
    await db.transaction('rw', db.projects, db.narrators, db.consents, async () => {
      await db.projects.add(project)
      await db.narrators.add(narrator)
      await db.consents.add(consent)
    })

    return { project, narrator, consent, interviews: [] }
  },

  async listProjects(): Promise<Project[]> {
    return projectRepository.getAll()
  },

  async getProjectDetail(projectId: string): Promise<ProjectDetail | null> {
    const project = await projectRepository.getById(projectId)
    if (!project) return null

    const narrator = await narratorRepository.getByProjectId(projectId)
    if (!narrator) return null

    const consent = await consentRepository.getByProjectId(projectId)
    if (!consent) return null

    const interviews = await interviewSessionRepository.listByProjectId(projectId)

    return { project, narrator, consent, interviews }
  },

  async deleteProject(projectId: string): Promise<void> {
    await db.transaction(
      'rw',
      db.projects,
      db.narrators,
      db.consents,
      db.interviews,
      async () => {
        await db.interviews.where('projectId').equals(projectId).delete()
        await db.narrators.where('projectId').equals(projectId).delete()
        await db.consents.where('projectId').equals(projectId).delete()
        await db.projects.delete(projectId)
      },
    )
  },

  async projectTitleExists(title: string): Promise<boolean> {
    return projectRepository.existsByTitle(title)
  },
}
