import { db } from '@/db/database'
import { createProject } from '@/models/project'
import { createNarrator } from '@/models/narrator'
import { createConsent } from '@/models/consent'
import { createInterviewSession } from '@/models/interview-session'
import { isExportFormat, type ExportFormat, type ExportFormatV2 } from '@/models/export-format'
import { projectService } from './project-service'
import { interviewSessionService } from './interview-session-service'

function sanitizeFilename(name: string): string {
  return name.replace(/[<>:"/\\|?*\x00-\x1f]/g, '_').replace(/\s+/g, ' ').trim()
}

function generateExportFilename(projectTitle: string): string {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '')
  const safeName = sanitizeFilename(projectTitle)
  return `memory-cabinet-${safeName}-${date}.json`
}

export const importExportService = {
  async exportProject(projectId: string): Promise<void> {
    const detail = await projectService.getProjectDetail(projectId)
    if (!detail) throw new Error('项目不存在')

    const { project, narrator, consent, interviews } = detail

    // Sort interviews by interviewDate ascending for export
    const sortedInterviews = [...interviews].sort((a, b) => a.interviewDate.localeCompare(b.interviewDate))

    const exportData: ExportFormatV2 = {
      format: 'memory-cabinet-project',
      schemaVersion: 2,
      appVersion: '0.2.0-alpha.2',
      exportedAt: new Date().toISOString(),
      project: { ...project, schemaVersion: 2 },
      narrator,
      consent,
      interviews: sortedInterviews,
    }

    const json = JSON.stringify(exportData, null, 2)
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = generateExportFilename(project.title)
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  },

  async importProject(file: File): Promise<{ success: boolean; projectId?: string; error?: string }> {
    let text: string
    try {
      text = await file.text()
    } catch {
      return { success: false, error: '无法读取文件，请检查文件是否损坏。' }
    }

    let data: unknown
    try {
      data = JSON.parse(text)
    } catch {
      return { success: false, error: '文件内容不是有效的 JSON 格式，请检查文件是否损坏。' }
    }

    // Validate format
    if (!isExportFormat(data)) {
      const obj = data as Record<string, unknown> | null
      if (obj && obj.format !== 'memory-cabinet-project') {
        return { success: false, error: '文件格式不正确，此文件不是时光展柜的导出文件。' }
      }
      if (obj && obj.schemaVersion !== 1 && obj.schemaVersion !== 2) {
        return { success: false, error: `不支持的版本号 ${obj?.schemaVersion}，当前仅支持版本 1 和 2。` }
      }
      return { success: false, error: '导入文件格式错误，请检查文件是否来自时光展柜的导出。' }
    }

    // Check if project name already exists
    let title = data.project.title
    const exists = await projectService.projectTitleExists(title)
    if (exists) {
      title = title + '（导入副本）'
    }

    // Generate new IDs
    const newProjectId = crypto.randomUUID()
    const newNarratorId = crypto.randomUUID()
    const newConsentId = crypto.randomUUID()

    const project = createProject({
      id: newProjectId,
      title,
      description: data.project.description ?? '',
      narratorId: newNarratorId,
      schemaVersion: 2,
      createdAt: data.project.createdAt,
      updatedAt: data.project.updatedAt,
    })

    const narrator = createNarrator({
      id: newNarratorId,
      projectId: newProjectId,
      name: data.narrator.name,
      relationshipToInterviewer: data.narrator.relationshipToInterviewer ?? '',
      birthYear: data.narrator.birthYear ?? null,
      notes: data.narrator.notes ?? '',
      createdAt: data.narrator.createdAt,
      updatedAt: data.narrator.updatedAt,
    })

    const consent = createConsent({
      id: newConsentId,
      projectId: newProjectId,
      consentToRecord: data.consent.consentToRecord,
      consentToStoreQuotes: data.consent.consentToStoreQuotes,
      consentToStorePhotos: data.consent.consentToStorePhotos,
      consentToFamilyView: data.consent.consentToFamilyView,
      consentToPublicDisplay: data.consent.consentToPublicDisplay,
      confirmedAt: data.consent.confirmedAt ?? new Date().toISOString(),
      confirmationMethod: data.consent.confirmationMethod ?? '',
      notes: data.consent.notes ?? '',
      createdAt: data.consent.createdAt,
      updatedAt: data.consent.updatedAt,
    })

    // Handle interviews for v2 (v1 has no interviews)
    const interviews: { id: string; projectId: string }[] = []
    if (data.schemaVersion === 2 && data.interviews) {
      for (const iv of data.interviews) {
        const newIvId = crypto.randomUUID()
        interviews.push({
          id: newIvId,
          projectId: newProjectId,
        })
      }
    }

    try {
      await db.transaction(
        'rw',
        db.projects,
        db.narrators,
        db.consents,
        db.interviews,
        async () => {
          await db.projects.add(project)
          await db.narrators.add(narrator)
          await db.consents.add(consent)
          if (data.schemaVersion === 2 && data.interviews) {
            for (let i = 0; i < data.interviews.length; i++) {
              const iv = data.interviews[i]
              const newIv = createInterviewSession({
                id: interviews[i]!.id,
                projectId: newProjectId,
                title: iv.title,
                interviewDate: iv.interviewDate,
                location: iv.location ?? '',
                interviewerName: iv.interviewerName ?? '',
                originalText: iv.originalText ?? '',
                notes: iv.notes ?? '',
                createdAt: iv.createdAt,
                updatedAt: iv.updatedAt,
              })
              await db.interviews.add(newIv)
            }
          }
        },
      )
    } catch {
      return { success: false, error: '导入过程中发生错误，未保留任何部分数据。' }
    }

    return { success: true, projectId: newProjectId }
  },
}
