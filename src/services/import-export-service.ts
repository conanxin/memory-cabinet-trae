// MANUAL_PATCH_FROM_DOCUMENT_CONTRACT
// Added schemaVersion 3 with memoryItems support

import { db } from '@/db/database'
import { createProject } from '@/models/project'
import { createNarrator } from '@/models/narrator'
import { createConsent } from '@/models/consent'
import { createInterviewSession } from '@/models/interview-session'
import { isExportFormat, type ExportFormatV3 } from '@/models/export-format'
import { projectService } from './project-service'
import { memoryItemRepository } from '@/repositories/memory-item-repository'
import {
  isValidMemoryItemType, isValidSourceType, isValidCertainty,
  isValidVisibility, isValidReviewStatus,
} from '@/models/memory-item'
import type { MemoryItem } from '@/models/memory-item'

function sanitizeFilename(name: string): string {
  return name.replace(/[<>:"/\\|?*\x00-\x1f]/g, '_').replace(/\s+/g, ' ').trim()
}

function generateExportFilename(projectTitle: string): string {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '')
  const safeName = sanitizeFilename(projectTitle)
  return `memory-cabinet-${safeName}-${date}.json`
}

function isValidDate(iso: string): boolean {
  if (typeof iso !== 'string') return false
  const d = new Date(iso)
  return !Number.isNaN(d.getTime()) && iso.length >= 10
}

export const importExportService = {
  async exportProject(projectId: string): Promise<void> {
    const detail = await projectService.getProjectDetail(projectId)
    if (!detail) throw new Error('项目不存在')

    const { project, narrator, consent, interviews } = detail

    const sortedInterviews = [...interviews].sort((a, b) => a.interviewDate.localeCompare(b.interviewDate))

    // Fetch memory items for v3 export
    const memoryItems = await memoryItemRepository.listByProjectId(projectId)
    const sortedMemoryItems = [...memoryItems].sort((a, b) => a.createdAt.localeCompare(b.createdAt))

    const exportData: ExportFormatV3 = {
      format: 'memory-cabinet-project',
      schemaVersion: 3,
      appVersion: '0.2.0-alpha.3',
      exportedAt: new Date().toISOString(),
      project: { ...project, schemaVersion: 3 },
      narrator,
      consent,
      interviews: sortedInterviews,
      memoryItems: sortedMemoryItems,
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
      if (obj && obj.schemaVersion !== 1 && obj.schemaVersion !== 2 && obj.schemaVersion !== 3) {
        return { success: false, error: `不支持的版本号 ${obj?.schemaVersion}，当前仅支持版本 1、2 和 3。` }
      }
      if (obj && (obj.schemaVersion === 2 || obj.schemaVersion === 3) && !Array.isArray((obj as Record<string, unknown>).interviews)) {
        return { success: false, error: '导入文件格式错误：版本 2 或 3 必须包含访谈数组。' }
      }
      if (obj && obj.schemaVersion === 3 && !Array.isArray((obj as Record<string, unknown>).memoryItems)) {
        return { success: false, error: '导入文件格式错误：版本 3 必须包含记忆卡片数组。' }
      }
      return { success: false, error: '导入文件格式错误，请检查文件是否来自时光展柜的导出。' }
    }

    // Validate interview data for v2/v3 (deep validation)
    if ((data.schemaVersion === 2 || data.schemaVersion === 3) && data.interviews) {
      for (const iv of data.interviews) {
        if (!iv.title || typeof iv.title !== 'string') {
          return { success: false, error: '访谈标题格式无效，至少一条访谈缺少标题。' }
        }
        if (!isValidDate(iv.interviewDate)) {
          return { success: false, error: '访谈日期格式无效，至少一条访谈的日期不是有效 ISO 日期。' }
        }
        if (!isValidDate(iv.createdAt)) {
          return { success: false, error: '访谈创建时间格式无效。' }
        }
        if (!isValidDate(iv.updatedAt)) {
          return { success: false, error: '访谈更新时间格式无效。' }
        }
      }
    }

    // Validate memory items for v3
    if (data.schemaVersion === 3 && data.memoryItems) {
      // Build a map from old interview IDs to their originalText for validation
      const oldInterviewMap = new Map<string, { originalText: string }>()
      if (data.interviews) {
        for (const iv of data.interviews) {
          oldInterviewMap.set(iv.id, { originalText: iv.originalText ?? '' })
        }
      }

      for (const mi of data.memoryItems) {
        if (!mi.id || typeof mi.id !== 'string') {
          return { success: false, error: '记忆卡片ID无效。' }
        }
        if (!mi.title || typeof mi.title !== 'string') {
          return { success: false, error: '记忆卡片标题无效。' }
        }
        if (!isValidMemoryItemType(mi.type)) {
          return { success: false, error: `记忆卡片类型无效：${mi.type}。` }
        }
        if (!isValidSourceType(mi.sourceType)) {
          return { success: false, error: `记忆卡片来源类型无效：${mi.sourceType}。` }
        }
        if (!isValidCertainty(mi.certainty)) {
          return { success: false, error: `记忆卡片可信度无效：${mi.certainty}。` }
        }
        if (!isValidVisibility(mi.visibility)) {
          return { success: false, error: `记忆卡片可见性无效：${mi.visibility}。` }
        }
        if (!isValidReviewStatus(mi.reviewStatus)) {
          return { success: false, error: `记忆卡片审核状态无效：${mi.reviewStatus}。` }
        }

        // Validate referenced interview exists
        const referencedInterview = oldInterviewMap.get(mi.interviewSessionId)
        if (!referencedInterview) {
          return { success: false, error: '记忆卡片引用的访谈不存在。' }
        }

        // Validate source range
        const hasStart = mi.sourceStart !== null && mi.sourceStart !== undefined
        const hasEnd = mi.sourceEnd !== null && mi.sourceEnd !== undefined
        if (hasStart !== hasEnd) {
          return { success: false, error: '记忆卡片的 sourceStart 和 sourceEnd 必须同时提供或同时为 null。' }
        }
        if (hasStart && hasEnd) {
          const s = mi.sourceStart as number
          const e = mi.sourceEnd as number
          if (s < 0 || e <= s || e > referencedInterview.originalText.length) {
            return { success: false, error: '记忆卡片的原文范围无效。' }
          }
          const substring = referencedInterview.originalText.substring(s, e)
          if (substring !== mi.originalText) {
            return { success: false, error: '记忆卡片的原文与访谈截取内容不一致。' }
          }
        }
      }
    }

    // Check if project name already exists and handle duplicates
    let title = data.project.title
    let candidate = title
    let dupCount = 0
    while (await projectService.projectTitleExists(candidate)) {
      dupCount++
      if (dupCount === 1) {
        candidate = title + '（导入副本）'
      } else {
        candidate = title + `（导入副本 ${dupCount}）`
      }
    }
    title = candidate

    // Generate new IDs
    const newProjectId = crypto.randomUUID()
    const newNarratorId = crypto.randomUUID()
    const newConsentId = crypto.randomUUID()

    const project = createProject({
      id: newProjectId,
      title,
      description: data.project.description ?? '',
      narratorId: newNarratorId,
      schemaVersion: 3,
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
      await db.transaction(
        'rw',
        [db.projects, db.narrators, db.consents, db.interviews, db.memoryItems],
        async () => {
          await db.projects.add(project)
          await db.narrators.add(narrator)
          await db.consents.add(consent)

          // Map old interview IDs to new ones
          const interviewIdMap = new Map<string, string>()

          if ((data.schemaVersion === 2 || data.schemaVersion === 3) && data.interviews) {
            for (const srcIv of data.interviews) {
              const newIvId = crypto.randomUUID()
              interviewIdMap.set(srcIv.id, newIvId)
              const newIv = createInterviewSession({
                id: newIvId,
                projectId: newProjectId,
                title: srcIv.title,
                interviewDate: srcIv.interviewDate,
                location: srcIv.location ?? '',
                interviewerName: srcIv.interviewerName ?? '',
                originalText: srcIv.originalText ?? '',
                notes: srcIv.notes ?? '',
                createdAt: srcIv.createdAt,
                updatedAt: srcIv.updatedAt,
              })
              await db.interviews.add(newIv)
            }
          }

          // Import memory items for v3
          if (data.schemaVersion === 3 && data.memoryItems) {
            for (const srcMi of data.memoryItems as MemoryItem[]) {
              const newMiId = crypto.randomUUID()
              const newInterviewId = interviewIdMap.get(srcMi.interviewSessionId)
              if (!newInterviewId) {
                throw new Error('记忆卡片引用的访谈不存在。')
              }
              const newMi: MemoryItem = {
                id: newMiId,
                projectId: newProjectId,
                interviewSessionId: newInterviewId,
                sourceId: newInterviewId,
                type: srcMi.type,
                title: srcMi.title,
                originalText: srcMi.originalText,
                editedText: srcMi.editedText,
                sourceStart: srcMi.sourceStart,
                sourceEnd: srcMi.sourceEnd,
                sourceType: srcMi.sourceType,
                certainty: srcMi.certainty,
                visibility: srcMi.visibility,
                reviewStatus: srcMi.reviewStatus,
                createdAt: srcMi.createdAt,
                updatedAt: srcMi.updatedAt,
              }
              await db.memoryItems.add(newMi)
            }
          }
        },
      )
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : '未知错误'
      return { success: false, error: `导入过程中发生错误：${msg}。未保留任何部分数据。` }
    }

    return { success: true, projectId: newProjectId }
  },
}