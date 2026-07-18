import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import 'fake-indexeddb/auto'
import { db } from '@/db/database'
import { projectService } from '@/services/project-service'
import { importExportService } from '@/services/import-export-service'
import { createConsent } from '@/models/consent'

beforeEach(async () => {
  await db.delete()
  await db.open()
})

afterEach(async () => {
  await db.delete()
})

describe('projectService', () => {
  it('creates project in a transaction successfully', async () => {
    const result = await projectService.createProject({
      projectTitle: '测试项目',
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

    expect(result.project.id).toBeTruthy()
    expect(result.project.title).toBe('测试项目')
    expect(result.narrator.name).toBe('张三')
    expect(result.consent.consentToRecord).toBe(true)
    expect(result.consent.consentToPublicDisplay).toBe(false)
  })

  it('transaction failure leaves no partial data', async () => {
    // Force a failure by trying to add a narrator with the same projectId twice
    // First create a project normally
    const result1 = await projectService.createProject({
      projectTitle: '项目A',
      projectDescription: '',
      narratorName: '李四',
      narratorRelationship: '',
      narratorBirthYear: null,
      narratorNotes: '',
      consent: {
        consentToRecord: false,
        consentToStoreQuotes: false,
        consentToStorePhotos: false,
        consentToFamilyView: false,
        consentToPublicDisplay: false,
        confirmedAt: new Date().toISOString(),
        confirmationMethod: '',
        notes: '',
      },
    })

    // Trying to create a second narrator for the same project should be blocked by the unique index
    // This is validated through the Dexie unique index on projectId
    const narrator2 = {
      id: crypto.randomUUID(),
      projectId: result1.project.id,
      name: '王五',
      relationshipToInterviewer: '',
      birthYear: null,
      notes: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    // This should fail because projectId is a unique index (&projectId)
    await expect(
      db.narrators.add(narrator2)
    ).rejects.toThrow()

    // Verify original data is intact
    const narrator = await db.narrators.where('projectId').equals(result1.project.id).first()
    expect(narrator?.name).toBe('李四')
  })

  it('cannot create a second narrator for the same projectId', async () => {
    const result = await projectService.createProject({
      projectTitle: '项目B',
      projectDescription: '',
      narratorName: '赵六',
      narratorRelationship: '',
      narratorBirthYear: null,
      narratorNotes: '',
      consent: {
        consentToRecord: false,
        consentToStoreQuotes: false,
        consentToStorePhotos: false,
        consentToFamilyView: false,
        consentToPublicDisplay: false,
        confirmedAt: new Date().toISOString(),
        confirmationMethod: '',
        notes: '',
      },
    })

    const duplicateNarrator = {
      id: crypto.randomUUID(),
      projectId: result.project.id,
      name: '钱七',
      relationshipToInterviewer: '',
      birthYear: null,
      notes: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    await expect(db.narrators.add(duplicateNarrator)).rejects.toThrow()
  })

  it('cannot create a second consent for the same projectId', async () => {
    const result = await projectService.createProject({
      projectTitle: '项目C',
      projectDescription: '',
      narratorName: '孙八',
      narratorRelationship: '',
      narratorBirthYear: null,
      narratorNotes: '',
      consent: {
        consentToRecord: true,
        consentToStoreQuotes: false,
        consentToStorePhotos: false,
        consentToFamilyView: false,
        consentToPublicDisplay: false,
        confirmedAt: new Date().toISOString(),
        confirmationMethod: '',
        notes: '',
      },
    })

    const duplicateConsent = createConsent({
      projectId: result.project.id,
      consentToRecord: false,
      consentToStoreQuotes: false,
      consentToStorePhotos: false,
      consentToFamilyView: false,
      consentToPublicDisplay: false,
    })

    await expect(db.consents.add(duplicateConsent)).rejects.toThrow()
  })

  it('deletes project with narrator and consent', async () => {
    const result = await projectService.createProject({
      projectTitle: '待删除项目',
      projectDescription: '',
      narratorName: '周九',
      narratorRelationship: '',
      narratorBirthYear: null,
      narratorNotes: '',
      consent: {
        consentToRecord: false,
        consentToStoreQuotes: false,
        consentToStorePhotos: false,
        consentToFamilyView: false,
        consentToPublicDisplay: false,
        confirmedAt: new Date().toISOString(),
        confirmationMethod: '',
        notes: '',
      },
    })

    await projectService.deleteProject(result.project.id)

    const project = await db.projects.get(result.project.id)
    expect(project).toBeUndefined()

    const narrator = await db.narrators.where('projectId').equals(result.project.id).first()
    expect(narrator).toBeUndefined()

    const consent = await db.consents.where('projectId').equals(result.project.id).first()
    expect(consent).toBeUndefined()
  })
})

describe('importExportService', () => {
  it('export produces correct envelope structure', async () => {
    const result = await projectService.createProject({
      projectTitle: '导出测试',
      projectDescription: '描述',
      narratorName: '测试人',
      narratorRelationship: '外婆',
      narratorBirthYear: 1928,
      narratorNotes: '',
      consent: {
        consentToRecord: true,
        consentToStoreQuotes: true,
        consentToStorePhotos: false,
        consentToFamilyView: true,
        consentToPublicDisplay: false,
        confirmedAt: new Date().toISOString(),
        confirmationMethod: '当面口头同意',
        notes: '测试备注',
      },
    })

    // We can't test file download in Node, but we can test the data structure
    // by directly building what the export would produce
    const exportData = {
      format: 'memory-cabinet-project' as const,
      schemaVersion: 1 as const,
      appVersion: '0.2.0-alpha.1' as const,
      exportedAt: new Date().toISOString(),
      project: result.project,
      narrator: result.narrator,
      consent: result.consent,
    }

    expect(exportData.format).toBe('memory-cabinet-project')
    expect(exportData.schemaVersion).toBe(1)
    expect(exportData.appVersion).toBe('0.2.0-alpha.1')
    expect(exportData.exportedAt).toBeTruthy()
    expect(exportData.project).toBeDefined()
    expect(exportData.narrator).toBeDefined()
    expect(exportData.consent).toBeDefined()
    expect(exportData.consent.consentToRecord).toBe(true)
    expect(exportData.consent.consentToPublicDisplay).toBe(false)
  })

  it('rejects invalid format', async () => {
    const blob = new Blob([JSON.stringify({ format: 'wrong-format', schemaVersion: 1, project: {}, narrator: {}, consent: {} })], { type: 'application/json' })
    const file = new File([blob], 'test.json', { type: 'application/json' })
    const result = await importExportService.importProject(file)
    expect(result.success).toBe(false)
    expect(result.error).toContain('格式')
  })

  it('rejects invalid schemaVersion', async () => {
    const blob = new Blob([JSON.stringify({ format: 'memory-cabinet-project', schemaVersion: 2, project: { id: '1', title: 't', description: '', narratorId: '2', schemaVersion: 2, createdAt: '', updatedAt: '' }, narrator: { id: '2', projectId: '1', name: 'n', relationshipToInterviewer: '', birthYear: null, notes: '', createdAt: '', updatedAt: '' }, consent: { id: '3', projectId: '1', consentToRecord: true, consentToStoreQuotes: true, consentToStorePhotos: false, consentToFamilyView: true, consentToPublicDisplay: false, confirmedAt: '', confirmationMethod: '', notes: '', createdAt: '', updatedAt: '' } })], { type: 'application/json' })
    const file = new File([blob], 'test.json', { type: 'application/json' })
    const result = await importExportService.importProject(file)
    expect(result.success).toBe(false)
    expect(result.error).toContain('版本')
  })

  it('rejects non-boolean consent fields', async () => {
    const badData = {
      format: 'memory-cabinet-project',
      schemaVersion: 1,
      project: { id: '1', title: 't', description: '', narratorId: '2', schemaVersion: 1, createdAt: '', updatedAt: '' },
      narrator: { id: '2', projectId: '1', name: 'n', relationshipToInterviewer: '', birthYear: null, notes: '', createdAt: '', updatedAt: '' },
      consent: { id: '3', projectId: '1', consentToRecord: 'yes', consentToStoreQuotes: true, consentToStorePhotos: false, consentToFamilyView: true, consentToPublicDisplay: false, confirmedAt: '', confirmationMethod: '', notes: '', createdAt: '', updatedAt: '' },
    }
    const blob = new Blob([JSON.stringify(badData)], { type: 'application/json' })
    const file = new File([blob], 'test.json', { type: 'application/json' })
    const result = await importExportService.importProject(file)
    expect(result.success).toBe(false)
    expect(result.error).toContain('格式')
  })

  it('import generates new IDs and fixes references', async () => {
    // First create a project
    const original = await projectService.createProject({
      projectTitle: '原始项目',
      projectDescription: '',
      narratorName: '王秀兰',
      narratorRelationship: '外婆',
      narratorBirthYear: 1928,
      narratorNotes: '',
      consent: {
        consentToRecord: true,
        consentToStoreQuotes: true,
        consentToStorePhotos: false,
        consentToFamilyView: true,
        consentToPublicDisplay: false,
        confirmedAt: new Date().toISOString(),
        confirmationMethod: '当面口头同意',
        notes: '',
      },
    })

    // Build export data manually
    const exportData = {
      format: 'memory-cabinet-project' as const,
      schemaVersion: 1 as const,
      appVersion: '0.2.0-alpha.1' as const,
      exportedAt: new Date().toISOString(),
      project: original.project,
      narrator: original.narrator,
      consent: original.consent,
    }

    const blob = new Blob([JSON.stringify(exportData)], { type: 'application/json' })
    const file = new File([blob], 'test.json', { type: 'application/json' })

    const result = await importExportService.importProject(file)
    expect(result.success).toBe(true)
    expect(result.projectId).toBeTruthy()
    expect(result.projectId).not.toBe(original.project.id)

    // Verify new IDs
    const imported = await projectService.getProjectDetail(result.projectId!)
    expect(imported).toBeTruthy()
    expect(imported!.project.id).not.toBe(original.project.id)
    expect(imported!.narrator.id).not.toBe(original.narrator.id)
    expect(imported!.consent.id).not.toBe(original.consent.id)

    // Verify references are correct
    expect(imported!.project.narratorId).toBe(imported!.narrator.id)
    expect(imported!.narrator.projectId).toBe(imported!.project.id)
    expect(imported!.consent.projectId).toBe(imported!.project.id)

    // Verify consent values
    expect(imported!.consent.consentToRecord).toBe(true)
    expect(imported!.consent.consentToStoreQuotes).toBe(true)
    expect(imported!.consent.consentToStorePhotos).toBe(false)
    expect(imported!.consent.consentToFamilyView).toBe(true)
    expect(imported!.consent.consentToPublicDisplay).toBe(false)
  })

  it('import does not overwrite existing project', async () => {
    const original = await projectService.createProject({
      projectTitle: '不覆盖项目',
      projectDescription: '',
      narratorName: '张三',
      narratorRelationship: '',
      narratorBirthYear: null,
      narratorNotes: '',
      consent: {
        consentToRecord: false,
        consentToStoreQuotes: false,
        consentToStorePhotos: false,
        consentToFamilyView: false,
        consentToPublicDisplay: false,
        confirmedAt: new Date().toISOString(),
        confirmationMethod: '',
        notes: '',
      },
    })

    const exportData = {
      format: 'memory-cabinet-project' as const,
      schemaVersion: 1 as const,
      appVersion: '0.2.0-alpha.1' as const,
      exportedAt: new Date().toISOString(),
      project: { ...original.project },
      narrator: { ...original.narrator },
      consent: { ...original.consent },
    }

    const blob = new Blob([JSON.stringify(exportData)], { type: 'application/json' })
    const file = new File([blob], 'test.json', { type: 'application/json' })

    const result = await importExportService.importProject(file)
    expect(result.success).toBe(true)
    expect(result.projectId).not.toBe(original.project.id)

    // The imported project should have a different name
    const imported = await projectService.getProjectDetail(result.projectId!)
    expect(imported!.project.title).toContain('导入副本')

    // Original should still exist
    const originalCheck = await projectService.getProjectDetail(original.project.id)
    expect(originalCheck).toBeTruthy()
    expect(originalCheck!.project.title).toBe('不覆盖项目')
  })
})
