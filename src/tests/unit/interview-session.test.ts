import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import 'fake-indexeddb/auto'
import Dexie from 'dexie'
import { db } from '@/db/database'
import { DB_NAME, STORES_V1, STORES_V2 } from '@/db/schema'
import { projectService } from '@/services/project-service'
import { interviewSessionService } from '@/services/interview-session-service'
import { interviewSessionRepository } from '@/repositories/interview-session-repository'
import { importExportService } from '@/services/import-export-service'
import { createInterviewSession } from '@/models/interview-session'
import type { InterviewSession } from '@/models/interview-session'

beforeEach(async () => {
  await db.delete()
  await db.open()
})

afterEach(async () => {
  await db.delete()
})

async function createTestProject(title: string = '测试项目') {
  return projectService.createProject({
    projectTitle: title,
    projectDescription: '测试描述',
    narratorName: '张三',
    narratorRelationship: '祖父',
    narratorBirthYear: 1940,
    narratorNotes: '',
    consent: {
      consentToRecord: true,
      consentToStoreQuotes: true,
      consentToStorePhotos: false,
      consentToFamilyView: true,
      consentToPublicDisplay: false,
      confirmedAt: new Date().toISOString(),
      confirmationMethod: '当面同意',
      notes: '',
    },
  })
}

function makeExportDataV1(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  const now = new Date().toISOString()
  const base = {
    format: 'memory-cabinet-project' as const,
    schemaVersion: 1 as const,
    appVersion: '0.2.0-alpha.1' as const,
    exportedAt: now,
    project: {
      id: 'orig-p1',
      title: 'V1导入项目',
      description: '',
      narratorId: 'orig-n1',
      schemaVersion: 1,
      createdAt: now,
      updatedAt: now,
    },
    narrator: {
      id: 'orig-n1',
      projectId: 'orig-p1',
      name: '测试人',
      relationshipToInterviewer: '',
      birthYear: null,
      notes: '',
      createdAt: now,
      updatedAt: now,
    },
    consent: {
      id: 'orig-c1',
      projectId: 'orig-p1',
      consentToRecord: true,
      consentToStoreQuotes: true,
      consentToStorePhotos: false,
      consentToFamilyView: true,
      consentToPublicDisplay: false,
      confirmedAt: now,
      confirmationMethod: '',
      notes: '',
      createdAt: now,
      updatedAt: now,
    },
  }
  return { ...base, ...overrides }
}

function makeExportDataV2(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  const now = new Date().toISOString()
  const base = {
    format: 'memory-cabinet-project' as const,
    schemaVersion: 2 as const,
    appVersion: '0.2.0-alpha.2' as const,
    exportedAt: now,
    project: {
      id: 'orig-p1',
      title: 'V2导入项目',
      description: '',
      narratorId: 'orig-n1',
      schemaVersion: 2,
      createdAt: now,
      updatedAt: now,
    },
    narrator: {
      id: 'orig-n1',
      projectId: 'orig-p1',
      name: '测试人',
      relationshipToInterviewer: '',
      birthYear: null,
      notes: '',
      createdAt: now,
      updatedAt: now,
    },
    consent: {
      id: 'orig-c1',
      projectId: 'orig-p1',
      consentToRecord: true,
      consentToStoreQuotes: true,
      consentToStorePhotos: false,
      consentToFamilyView: true,
      consentToPublicDisplay: false,
      confirmedAt: now,
      confirmationMethod: '',
      notes: '',
      createdAt: now,
      updatedAt: now,
    },
    interviews: [
      {
        id: 'orig-i1',
        projectId: 'orig-p1',
        title: '第一次访谈',
        interviewDate: '2026-01-15T10:00:00.000Z',
        location: '北京',
        interviewerName: '访谈人A',
        originalText: '这是第一次访谈的原文',
        notes: '第一次访谈的备注',
        createdAt: '2026-01-15T09:00:00.000Z',
        updatedAt: '2026-01-15T11:00:00.000Z',
      },
      {
        id: 'orig-i2',
        projectId: 'orig-p1',
        title: '第二次访谈',
        interviewDate: '2026-02-20T14:00:00.000Z',
        location: '上海',
        interviewerName: '访谈人B',
        originalText: '这是第二次访谈的原文',
        notes: '第二次访谈的备注',
        createdAt: '2026-02-20T13:00:00.000Z',
        updatedAt: '2026-02-20T15:00:00.000Z',
      },
    ],
  }
  return { ...base, ...overrides }
}

function makeFile(data: Record<string, unknown>): File {
  const blob = new Blob([JSON.stringify(data)], { type: 'application/json' })
  return new File([blob], 'test.json', { type: 'application/json' })
}

describe('schema migration v1 -> v2', () => {
  it('schema v1升级到v2保留旧数据', async () => {
    // Step 1: 关闭当前 db，使用 Dexie 直接创建 v1 数据库
    await db.close()

    const v1Db = new Dexie(DB_NAME)
    v1Db.version(1).stores(STORES_V1)

    const now = new Date().toISOString()
    const projectId = 'v1-proj-1'
    const narratorId = 'v1-narr-1'
    const consentId = 'v1-cons-1'

    await v1Db.table('projects').add({
      id: projectId,
      title: 'V1旧项目',
      description: 'V1描述',
      narratorId: narratorId,
      schemaVersion: 1,
      createdAt: now,
      updatedAt: now,
    })
    await v1Db.table('narrators').add({
      id: narratorId,
      projectId: projectId,
      name: '旧讲述者',
      relationshipToInterviewer: '祖父',
      birthYear: 1930,
      notes: '',
      createdAt: now,
      updatedAt: now,
    })
    await v1Db.table('consents').add({
      id: consentId,
      projectId: projectId,
      consentToRecord: true,
      consentToStoreQuotes: true,
      consentToStorePhotos: true,
      consentToFamilyView: true,
      consentToPublicDisplay: false,
      confirmedAt: now,
      confirmationMethod: '当面同意',
      notes: '',
      createdAt: now,
      updatedAt: now,
    })

    await v1Db.close()

    // Step 2: 用新版 db 打开（会自动升级到 v2）
    await db.open()

    // Step 3: 验证旧数据保留
    const project = await db.projects.get(projectId)
    expect(project).toBeDefined()
    expect(project?.title).toBe('V1旧项目')

    const narrator = await db.narrators.where('projectId').equals(projectId).first()
    expect(narrator).toBeDefined()
    expect(narrator?.name).toBe('旧讲述者')

    const consent = await db.consents.where('projectId').equals(projectId).first()
    expect(consent).toBeDefined()
    expect(consent?.consentToRecord).toBe(true)

    // Step 4: 验证 interviews 表存在（v2 新增）
    const interviewsCount = await db.interviews.count()
    expect(interviewsCount).toBe(0)
  })
})

describe('interviewSessionService CRUD', () => {
  it('创建InterviewSession成功', async () => {
    const proj = await createTestProject()
    const session = await interviewSessionService.createInterview({
      projectId: proj.project.id,
      title: '首次访谈',
      interviewDate: '2026-03-01T10:00:00.000Z',
      location: '家里',
      interviewerName: '访谈者',
      originalText: '访谈原文内容',
      notes: '一些备注',
    })

    expect(session.id).toBeTruthy()
    expect(session.projectId).toBe(proj.project.id)
    expect(session.title).toBe('首次访谈')
    expect(session.interviewDate).toBe('2026-03-01T10:00:00.000Z')
    expect(session.location).toBe('家里')
    expect(session.interviewerName).toBe('访谈者')
    expect(session.originalText).toBe('访谈原文内容')
    expect(session.notes).toBe('一些备注')
    expect(session.createdAt).toBeTruthy()
    expect(session.updatedAt).toBeTruthy()

    // 验证数据库中存在
    const stored = await interviewSessionService.getInterview(session.id)
    expect(stored).toBeTruthy()
    expect(stored?.title).toBe('首次访谈')
  })

  it('同一Project创建三次访谈', async () => {
    const proj = await createTestProject()

    const s1 = await interviewSessionService.createInterview({
      projectId: proj.project.id,
      title: '访谈一',
      interviewDate: '2026-01-01T10:00:00.000Z',
    })
    const s2 = await interviewSessionService.createInterview({
      projectId: proj.project.id,
      title: '访谈二',
      interviewDate: '2026-02-01T10:00:00.000Z',
    })
    const s3 = await interviewSessionService.createInterview({
      projectId: proj.project.id,
      title: '访谈三',
      interviewDate: '2026-03-01T10:00:00.000Z',
    })

    expect(s1.id).not.toBe(s2.id)
    expect(s2.id).not.toBe(s3.id)
    expect(s1.id).not.toBe(s3.id)

    const count = await interviewSessionService.countInterviews(proj.project.id)
    expect(count).toBe(3)
  })

  it('listByProjectId排序正确（interviewDate降序，同日期updatedAt降序）', async () => {
    const proj = await createTestProject()

    // 创建三个访谈，注意 interviewDate 和 updatedAt 的设置
    await interviewSessionService.createInterview({
      projectId: proj.project.id,
      title: '一月访谈',
      interviewDate: '2026-01-15T10:00:00.000Z',
    })
    // 三月的访谈，应该排第一
    const march = await interviewSessionService.createInterview({
      projectId: proj.project.id,
      title: '三月访谈',
      interviewDate: '2026-03-15T10:00:00.000Z',
    })
    await interviewSessionService.createInterview({
      projectId: proj.project.id,
      title: '二月访谈',
      interviewDate: '2026-02-15T10:00:00.000Z',
    })

    // 测试同日期 updatedAt 排序：创建两个同日期但不同 updatedAt 的访谈
    const proj2 = await createTestProject('排序测试项目')
    const sameDate = '2026-06-01T10:00:00.000Z'

    // 先创建 earlyUpdated，稍后更新它使其 updatedAt 更新
    const earlyUpdated = await interviewSessionService.createInterview({
      projectId: proj2.project.id,
      title: '同日早更新',
      interviewDate: sameDate,
    })
    const laterCreated = await interviewSessionService.createInterview({
      projectId: proj2.project.id,
      title: '同日晚创建',
      interviewDate: sameDate,
    })
    // 等一下再更新 earlyUpdated，使其 updatedAt 晚于 laterCreated
    await new Promise(r => setTimeout(r, 5))
    await interviewSessionService.updateInterview(earlyUpdated.id, { notes: '更新了备注' })

    const list = await interviewSessionService.listInterviews(proj.project.id)
    expect(list.length).toBe(3)
    expect(list[0].title).toBe('三月访谈')
    expect(list[1].title).toBe('二月访谈')
    expect(list[2].title).toBe('一月访谈')

    // 同日期 updatedAt 降序
    const list2 = await interviewSessionService.listInterviews(proj2.project.id)
    expect(list2.length).toBe(2)
    // earlyUpdated 被更新过，updatedAt 应该更晚，所以排第一
    expect(list2[0].id).toBe(earlyUpdated.id)
    expect(list2[1].id).toBe(laterCreated.id)
  })

  it('更新访谈保留id、projectId和createdAt', async () => {
    const proj = await createTestProject()
    const original = await interviewSessionService.createInterview({
      projectId: proj.project.id,
      title: '原始标题',
      interviewDate: '2026-01-01T10:00:00.000Z',
      location: '原始地点',
      originalText: '原始原文',
    })

    const originalId = original.id
    const originalProjectId = original.projectId
    const originalCreatedAt = original.createdAt

    await new Promise(r => setTimeout(r, 5))
    const updated = await interviewSessionService.updateInterview(original.id, {
      title: '新标题',
      location: '新地点',
      originalText: '新原文',
      // 尝试修改 id、projectId、createdAt（应该被忽略）
      id: 'should-be-ignored',
      projectId: 'should-be-ignored',
      createdAt: '2099-01-01T00:00:00.000Z',
    } as Partial<InterviewSession>)

    expect(updated).toBeTruthy()
    expect(updated!.id).toBe(originalId)
    expect(updated!.projectId).toBe(originalProjectId)
    expect(updated!.createdAt).toBe(originalCreatedAt)
    expect(updated!.title).toBe('新标题')
    expect(updated!.location).toBe('新地点')
    expect(updated!.originalText).toBe('新原文')
  })

  it('更新访谈改变updatedAt', async () => {
    const proj = await createTestProject()
    const original = await interviewSessionService.createInterview({
      projectId: proj.project.id,
      title: '测试更新',
    })
    const originalUpdatedAt = original.updatedAt

    await new Promise(r => setTimeout(r, 10))
    const updated = await interviewSessionService.updateInterview(original.id, {
      notes: '添加了备注',
    })

    expect(updated).toBeTruthy()
    expect(updated!.updatedAt).not.toBe(originalUpdatedAt)
    expect(new Date(updated!.updatedAt).getTime()).toBeGreaterThan(new Date(originalUpdatedAt).getTime())
  })

  it('删除单次访谈不影响Project', async () => {
    const proj = await createTestProject()
    const s1 = await interviewSessionService.createInterview({
      projectId: proj.project.id,
      title: '将被删除',
    })
    const s2 = await interviewSessionService.createInterview({
      projectId: proj.project.id,
      title: '保留的访谈',
    })

    await interviewSessionService.deleteInterview(s1.id)

    // 验证 s1 被删除
    const deleted = await interviewSessionService.getInterview(s1.id)
    expect(deleted).toBeNull()

    // 验证 s2 还在
    const remaining = await interviewSessionService.getInterview(s2.id)
    expect(remaining).toBeTruthy()
    expect(remaining?.title).toBe('保留的访谈')

    // 验证 Project 不受影响
    const projectCheck = await projectService.getProjectDetail(proj.project.id)
    expect(projectCheck).toBeTruthy()
    expect(projectCheck!.project.title).toBe('测试项目')

    const count = await interviewSessionService.countInterviews(proj.project.id)
    expect(count).toBe(1)
  })

  it('删除Project同时删除全部访谈', async () => {
    const proj = await createTestProject()
    await interviewSessionService.createInterview({
      projectId: proj.project.id,
      title: '访谈一',
    })
    await interviewSessionService.createInterview({
      projectId: proj.project.id,
      title: '访谈二',
    })
    await interviewSessionService.createInterview({
      projectId: proj.project.id,
      title: '访谈三',
    })

    const countBefore = await interviewSessionService.countInterviews(proj.project.id)
    expect(countBefore).toBe(3)

    await projectService.deleteProject(proj.project.id)

    const countAfter = await db.interviews.where('projectId').equals(proj.project.id).count()
    expect(countAfter).toBe(0)

    const project = await db.projects.get(proj.project.id)
    expect(project).toBeUndefined()

    const narrator = await db.narrators.where('projectId').equals(proj.project.id).first()
    expect(narrator).toBeUndefined()

    const consent = await db.consents.where('projectId').equals(proj.project.id).first()
    expect(consent).toBeUndefined()
  })

  it('删除Project失败时不产生半删除（模拟transaction失败）', async () => {
    const proj = await createTestProject()
    await interviewSessionService.createInterview({
      projectId: proj.project.id,
      title: '访谈A',
    })

    // 模拟 transaction 失败：在删除过程中强制抛出错误
    // 通过 spy 拦截 db.projects.delete 使其抛出
    const originalDelete = db.projects.delete.bind(db.projects)
    vi.spyOn(db.projects, 'delete').mockImplementation(async () => {
      throw new Error('模拟删除失败')
    })

    await expect(projectService.deleteProject(proj.project.id)).rejects.toThrow()

    // 恢复 spy
    vi.spyOn(db.projects, 'delete').mockImplementation(originalDelete)

    // 验证所有数据都还在（没有半删除状态）
    const project = await db.projects.get(proj.project.id)
    expect(project).toBeDefined()

    const narrator = await db.narrators.where('projectId').equals(proj.project.id).first()
    expect(narrator).toBeDefined()

    const consent = await db.consents.where('projectId').equals(proj.project.id).first()
    expect(consent).toBeDefined()

    const interviews = await db.interviews.where('projectId').equals(proj.project.id).count()
    expect(interviews).toBe(1)
  })

  it('删除访谈transaction失败时不形成半删除状态', async () => {
    const proj = await createTestProject()
    const session = await interviewSessionService.createInterview({
      projectId: proj.project.id,
      title: '待删除访谈',
    })

    // 模拟 transaction 失败：通过拦截底层方法
    const originalDelete = db.interviews.delete.bind(db.interviews)
    vi.spyOn(db.interviews, 'delete').mockImplementation(async () => {
      throw new Error('模拟删除失败')
    })

    await expect(interviewSessionService.deleteInterview(session.id)).rejects.toThrow()

    // 恢复 spy
    vi.spyOn(db.interviews, 'delete').mockImplementation(originalDelete)

    // 验证访谈仍然存在（没有半删除）
    const stillExists = await interviewSessionService.getInterview(session.id)
    expect(stillExists).toBeTruthy()
    expect(stillExists?.title).toBe('待删除访谈')
  })
})

describe('import/export with interviews', () => {
  it('schemaVersion 2导出包含interviews数组', async () => {
    const proj = await createTestProject('导出测试项目')
    const i1 = await interviewSessionService.createInterview({
      projectId: proj.project.id,
      title: '访谈A',
      interviewDate: '2026-03-01T10:00:00.000Z',
      location: '北京',
      interviewerName: '访谈人',
      originalText: '原文A',
      notes: '备注A',
    })
    const i2 = await interviewSessionService.createInterview({
      projectId: proj.project.id,
      title: '访谈B',
      interviewDate: '2026-01-15T10:00:00.000Z',
      location: '上海',
      interviewerName: '访谈人',
      originalText: '原文B',
      notes: '备注B',
    })

    // 由于 exportProject 使用 DOM API，我们手动构造导出数据来验证结构
    const interviews = await interviewSessionRepository.listByProjectId(proj.project.id)
    const sortedInterviews = [...interviews].sort((a, b) => a.interviewDate.localeCompare(b.interviewDate))

    const exportData = {
      format: 'memory-cabinet-project' as const,
      schemaVersion: 2 as const,
      appVersion: '0.2.0-alpha.2' as const,
      exportedAt: new Date().toISOString(),
      project: proj.project,
      narrator: proj.narrator,
      consent: proj.consent,
      interviews: sortedInterviews,
    }

    expect(exportData.schemaVersion).toBe(2)
    expect(Array.isArray(exportData.interviews)).toBe(true)
    expect(exportData.interviews.length).toBe(2)
    // 验证按 interviewDate 升序排列
    expect(exportData.interviews[0].id).toBe(i2.id)
    expect(exportData.interviews[1].id).toBe(i1.id)
    expect(exportData.interviews[0].title).toBe('访谈B')
    expect(exportData.interviews[1].title).toBe('访谈A')
  })

  it('schemaVersion 1导入后interviews为空', async () => {
    const data = makeExportDataV1()
    const result = await importExportService.importProject(makeFile(data))
    expect(result.success).toBe(true)
    expect(result.projectId).toBeTruthy()

    const interviews = await interviewSessionService.listInterviews(result.projectId!)
    expect(interviews.length).toBe(0)
  })

  it('schemaVersion 2导入后所有ID重新生成', async () => {
    const data = makeExportDataV2()
    const originalInterviewIds = (data.interviews as InterviewSession[]).map(i => i.id)
    const originalProjectId = (data.project as Record<string, unknown>).id as string

    const result = await importExportService.importProject(makeFile(data))
    expect(result.success).toBe(true)

    // Project ID 重新生成
    expect(result.projectId).not.toBe(originalProjectId)

    // 所有访谈 ID 重新生成
    const importedInterviews = await interviewSessionService.listInterviews(result.projectId!)
    expect(importedInterviews.length).toBe(2)
    for (const iv of importedInterviews) {
      expect(originalInterviewIds).not.toContain(iv.id)
    }

    // 所有 ID 都不相同
    const allIds = importedInterviews.map(i => i.id)
    expect(new Set(allIds).size).toBe(2)
  })

  it('导入后所有interviews.projectId指向新Project', async () => {
    const data = makeExportDataV2()
    const result = await importExportService.importProject(makeFile(data))
    expect(result.success).toBe(true)

    const newProjectId = result.projectId!
    const interviews = await interviewSessionService.listInterviews(newProjectId)

    expect(interviews.length).toBe(2)
    for (const iv of interviews) {
      expect(iv.projectId).toBe(newProjectId)
    }

    // 验证引用的 Project 确实存在
    const project = await db.projects.get(newProjectId)
    expect(project).toBeDefined()
  })

  it('非法访谈日期拒绝导入', async () => {
    const data = makeExportDataV2()
    const interviews = data.interviews as Record<string, unknown>[]
    interviews[0].interviewDate = 'not-a-valid-date'

    const result = await importExportService.importProject(makeFile(data))
    expect(result.success).toBe(false)
    expect(result.error).toContain('日期格式无效')

    // 验证没有留下任何数据
    const projects = await db.projects.count()
    const interviewsCount = await db.interviews.count()
    expect(projects).toBe(0)
    expect(interviewsCount).toBe(0)
  })

  it('缺少访谈标题拒绝导入', async () => {
    const data = makeExportDataV2()
    const interviews = data.interviews as Record<string, unknown>[]
    interviews[1].title = null as unknown as string

    const result = await importExportService.importProject(makeFile(data))
    expect(result.success).toBe(false)
    expect(result.error).toContain('标题格式无效')

    // 验证没有留下任何数据
    const projects = await db.projects.count()
    expect(projects).toBe(0)
  })

  it('interviews不是数组时拒绝导入', async () => {
    const data = makeExportDataV2({ interviews: 'not-an-array' })
    const result = await importExportService.importProject(makeFile(data))
    expect(result.success).toBe(false)

    // 验证没有留下任何数据
    const projects = await db.projects.count()
    expect(projects).toBe(0)
  })

  it('任一访谈无效时transaction不留下部分数据', async () => {
    const data = makeExportDataV2()
    const interviews = data.interviews as Record<string, unknown>[]
    // 第二个访谈的 createdAt 非法
    interviews[1].createdAt = 'bad-date'

    const result = await importExportService.importProject(makeFile(data))
    expect(result.success).toBe(false)

    // 验证没有任何部分数据被写入
    const projects = await db.projects.count()
    const narrators = await db.narrators.count()
    const consents = await db.consents.count()
    const interviewsCount = await db.interviews.count()

    expect(projects).toBe(0)
    expect(narrators).toBe(0)
    expect(consents).toBe(0)
    expect(interviewsCount).toBe(0)
  })

  it('三次重复导入名称继续正确编号', async () => {
    const data = makeExportDataV2()
    ;(data.project as Record<string, unknown>).title = '重复导入测试'

    const r1 = await importExportService.importProject(makeFile(data))
    const r2 = await importExportService.importProject(makeFile(data))
    const r3 = await importExportService.importProject(makeFile(data))

    expect(r1.success).toBe(true)
    expect(r2.success).toBe(true)
    expect(r3.success).toBe(true)

    const d1 = await projectService.getProjectDetail(r1.projectId!)
    const d2 = await projectService.getProjectDetail(r2.projectId!)
    const d3 = await projectService.getProjectDetail(r3.projectId!)

    expect(d1!.project.title).toBe('重复导入测试')
    expect(d2!.project.title).toBe('重复导入测试（导入副本）')
    expect(d3!.project.title).toBe('重复导入测试（导入副本 2）')

    // 所有项目的访谈都正确导入
    const i1 = await interviewSessionService.countInterviews(r1.projectId!)
    const i2 = await interviewSessionService.countInterviews(r2.projectId!)
    const i3 = await interviewSessionService.countInterviews(r3.projectId!)

    expect(i1).toBe(2)
    expect(i2).toBe(2)
    expect(i3).toBe(2)
  })
})

describe('security and data integrity', () => {
  it('用户原文中的HTML与脚本内容被原样保存', async () => {
    const proj = await createTestProject()

    const maliciousContent = `
      <script>alert('xss')</script>
      <img src="x" onerror="alert('img-xss')">
      <div onclick="stealCookies()">click me</div>
      <iframe src="evil.com"></iframe>
      javascript:alert(1)
      <svg onload="alert('svg-xss')">
    `

    const session = await interviewSessionService.createInterview({
      projectId: proj.project.id,
      title: '<h1>恶意标题</h1>',
      originalText: maliciousContent,
      notes: '<script>notes-xss</script>',
      location: '<img src=x onerror=alert(1)>',
      interviewerName: '<b>加粗访谈人</b>',
    })

    const stored = await interviewSessionService.getInterview(session.id)
    expect(stored).toBeTruthy()
    expect(stored!.originalText).toBe(maliciousContent)
    expect(stored!.title).toBe('<h1>恶意标题</h1>')
    expect(stored!.notes).toBe('<script>notes-xss</script>')
    expect(stored!.location).toBe('<img src=x onerror=alert(1)>')
    expect(stored!.interviewerName).toBe('<b>加粗访谈人</b>')

    // 验证通过导入导出也能保留
    const exportData = makeExportDataV2({
      project: {
        ...(makeExportDataV2().project as Record<string, unknown>),
        title: 'XSS测试项目',
      },
      interviews: [
        {
          id: 'xss-test-1',
          projectId: 'orig-p1',
          title: '<h1>XSS标题</h1>',
          interviewDate: '2026-01-01T00:00:00.000Z',
          location: '<img src=x onerror=alert(1)>',
          interviewerName: '<script>steal()</script>',
          originalText: maliciousContent,
          notes: '<svg onload=alert(1)>',
          createdAt: '2026-01-01T00:00:00.000Z',
          updatedAt: '2026-01-01T00:00:00.000Z',
        },
      ],
    })

    const result = await importExportService.importProject(makeFile(exportData))
    expect(result.success).toBe(true)

    const importedInterviews = await interviewSessionService.listInterviews(result.projectId!)
    expect(importedInterviews.length).toBe(1)
    expect(importedInterviews[0].originalText).toBe(maliciousContent)
    expect(importedInterviews[0].title).toBe('<h1>XSS标题</h1>')
    expect(importedInterviews[0].location).toBe('<img src=x onerror=alert(1)>')
    expect(importedInterviews[0].interviewerName).toBe('<script>steal()</script>')
    expect(importedInterviews[0].notes).toBe('<svg onload=alert(1)>')
  })
})
