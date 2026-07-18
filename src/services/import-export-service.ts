import { db } from '@/db/database'
import { createProject } from '@/models/project'
import { createNarrator } from '@/models/narrator'
import { createConsent } from '@/models/consent'
import { isExportFormat, type ExportFormat } from '@/models/export-format'
import { projectService } from './project-service'

function sanitizeFilename(name: string): string {
  return name.replace(/[<>:""/\\|?*\x00-\x1f]/g, '_').replace(/\s+/g, ' ').trim()
}

function generateExportFilename(projectTitle: string): string {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '')
  const safeName = sanitizeFilename(projectTitle)
  return `memory-cabinet-$safeName-$date.json`
}

export const importExportService = {
  async exportProject(projectId: string): Promise<void> {
    const detail = await projectService.getProjectDetail(projectId)
    if (!detail) throw new Error('椤圭洰涓嶅瓨鍦?)

    const { project, narrator, consent } = detail
    const exportData: ExportFormat = {
      format: 'memory-cabinet-project',
      schemaVersion: 1,
      appVersion: '0.2.0-alpha.1',
      exportedAt: new Date().toISOString(),
      project,
      narrator,
      consent,
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
      return { success: false, error: '鏃犳硶璇诲彇鏂囦欢锛岃妫€鏌ユ枃浠舵槸鍚︽崯鍧忋€? }
    }

    let data: unknown
    try {
      data = JSON.parse(text)
    } catch {
      return { success: false, error: '鏂囦欢鍐呭涓嶆槸鏈夋晥鐨?JSON 鏍煎紡锛岃妫€鏌ユ枃浠舵槸鍚︽崯鍧忋€? }
    }

    // Validate format
    if (!isExportFormat(data)) {
      const obj = data as Record<string, unknown> | null
      if (obj && obj.format !== 'memory-cabinet-project') {
        return { success: false, error: '鏂囦欢鏍煎紡涓嶆纭紝姝ゆ枃浠朵笉鏄椂鍏夊睍鏌滅殑瀵煎嚭鏂囦欢銆? }
      }
      if (obj && obj.schemaVersion !== 1) {
        return { success: false, error: `涓嶆敮鎸佺殑鐗堟湰鍙?` + `${obj.schemaVersion}锛屽綋鍓嶄粎鏀寔鐗堟湰 1銆俙 }
      }
      return { success: false, error: '瀵煎叆鏂囦欢鏍煎紡閿欒锛岃妫€鏌ユ枃浠舵槸鍚︽潵鑷椂鍏夊睍鏌滅殑瀵煎嚭銆? }
    }

    // Check if project name already exists
    let title = data.project.title
    const exists = await projectService.projectTitleExists(title)
    if (exists) {
      title = title + '锛堝鍏ュ壇鏈級'
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
      schemaVersion: data.project.schemaVersion,
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

    try {
      await db.transaction('rw', db.projects, db.narrators, db.consents, async () => {
        await db.projects.add(project)
        await db.narrators.add(narrator)
        await db.consents.add(consent)
      })
    } catch {
      return { success: false, error: '瀵煎叆杩囩▼涓彂鐢熼敊璇紝鏈繚鐣欎换浣曢儴鍒嗘暟鎹€? }
    }

    return { success: true, projectId: newProjectId }
  },
}
