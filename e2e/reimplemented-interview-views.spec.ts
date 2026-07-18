// MANUAL_RUNTIME_VALIDATION_TEST
import { test, expect, type Page } from '@playwright/test'
import fs from 'fs'
import path from 'path'
import os from 'os'

const PROJECT_NAME = 'R2C Runtime Validation Project'
const MOBILE_VIEW = { width: 390, height: 844 }

async function clearStorage(page: Page) {
  await page.goto('/#/projects')
  await page.waitForLoadState('networkidle')
  await page.evaluate(() => {
    const req = indexedDB.deleteDatabase('memory-cabinet-db')
    return new Promise<void>((resolve) => {
      req.onsuccess = () => resolve()
      req.onerror = () => resolve()
      req.onblocked = () => resolve()
    })
  })
}

async function createProject(page: Page, name: string) {
  await page.goto('/#/projects')
  await page.waitForLoadState('networkidle')
  await page.getByRole('link', { name: '新建项目' }).click()
  await page.waitForLoadState('networkidle')
  await page.locator('#project-title').fill(name)
  await page.locator('#narrator-name').fill('测试讲述者')
  await page.getByRole('button', { name: '创建项目' }).click()
  await page.waitForLoadState('networkidle')
}

test.beforeEach(async ({ page }) => {
  await clearStorage(page)
  await page.setViewportSize(MOBILE_VIEW)
})

test('1-4: create project, empty state, start first interview, default title', async ({ page }) => {
  await createProject(page, PROJECT_NAME)
  await expect(page.getByRole('heading', { name: PROJECT_NAME })).toBeVisible()
  await expect(page.getByText('暂无访谈记录')).toBeVisible()
  await page.getByRole('link', { name: '开始第一次访谈' }).click()
  await page.waitForLoadState('networkidle')
  await expect(page.getByRole('heading', { name: '新增访谈' })).toBeVisible()
  await expect(page.locator('.info-value').filter({ hasText: PROJECT_NAME })).toBeVisible()
  await expect(page.locator('#interview-title')).toHaveValue('第1次访谈')
})

test('5-9: save first, show 1, create second with default title', async ({ page }) => {
  await createProject(page, PROJECT_NAME)
  await page.getByRole('link', { name: '开始第一次访谈' }).click()
  await page.waitForLoadState('networkidle')
  await page.getByRole('button', { name: '保存访谈' }).click()
  await page.waitForLoadState('networkidle')
  await expect(page.getByText('1 次访谈')).toBeVisible()
  await page.getByRole('link', { name: '新增访谈' }).click()
  await page.waitForLoadState('networkidle')
  await expect(page.locator('#interview-title')).toHaveValue('第2次访谈')
  await page.getByRole('button', { name: '保存访谈' }).click()
  await page.waitForLoadState('networkidle')
  await expect(page.getByText('2 次访谈')).toBeVisible()
})

test('10: refresh persists 2 interviews', async ({ page }) => {
  await createProject(page, PROJECT_NAME)
  for (let i = 0; i < 2; i++) {
    const btn = i === 0 ? '开始第一次访谈' : '新增访谈'
    await page.getByRole('link', { name: btn }).click()
    await page.waitForLoadState('networkidle')
    await page.getByRole('button', { name: '保存访谈' }).click()
    await page.waitForLoadState('networkidle')
  }
  await expect(page.getByText('2 次访谈')).toBeVisible()
  await page.reload()
  await page.waitForLoadState('networkidle')
  await expect(page.getByText('2 次访谈')).toBeVisible()
})

test('11-15: open, edit title and text, save, refresh persists', async ({ page }) => {
  await createProject(page, PROJECT_NAME)
  await page.getByRole('link', { name: '开始第一次访谈' }).click()
  await page.waitForLoadState('networkidle')
  await page.getByRole('button', { name: '保存访谈' }).click()
  await page.waitForLoadState('networkidle')
  await page.locator('.interview-item').first().click()
  await page.waitForLoadState('networkidle')
  await expect(page.locator('#interview-title')).toBeVisible()
  await page.locator('#interview-title').fill('修改后的访谈标题')
  await page.locator('#interview-original-text').click()
  await page.locator('#interview-original-text').fill('这是修改后的原始口述文字内容。')
  await page.getByRole('button', { name: '保存修改' }).click()
  await page.waitForLoadState('networkidle')
  await expect(page.getByText('修改后的访谈标题')).toBeVisible()
  await page.reload()
  await page.waitForLoadState('networkidle')
  await page.locator('.interview-item').first().click()
  await page.waitForLoadState('networkidle')
  await expect(page.locator('#interview-title')).toHaveValue('修改后的访谈标题')
  await expect(page.locator('#interview-original-text')).toHaveValue('这是修改后的原始口述文字内容。')
})

test('16-19: delete confirm, Escape closes, confirm delete, other remains', async ({ page }) => {
  await createProject(page, PROJECT_NAME)
  for (let i = 0; i < 2; i++) {
    const btn = i === 0 ? '开始第一次访谈' : '新增访谈'
    await page.getByRole('link', { name: btn }).click()
    await page.waitForLoadState('networkidle')
    await page.locator('#interview-title').fill(i === 0 ? '访谈A' : '访谈B')
    await page.getByRole('button', { name: '保存访谈' }).click()
    await page.waitForLoadState('networkidle')
  }
  await expect(page.getByText('2 次访谈')).toBeVisible()
  await page.getByText('访谈A').click()
  await page.waitForLoadState('networkidle')
  await page.getByRole('button', { name: '删除本次访谈' }).click()
  await expect(page.getByRole('heading', { name: '删除本次访谈' })).toBeVisible()
  await expect(page.getByText('确定要删除本次访谈吗？')).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(page.getByText('确定要删除本次访谈吗？')).not.toBeVisible()
  await page.getByRole('button', { name: '删除本次访谈' }).click()
  await page.getByRole('button', { name: '确认删除' }).click()
  await page.waitForLoadState('networkidle')
  await expect(page.getByText('1 次访谈')).toBeVisible()
  await expect(page.getByText('访谈B')).toBeVisible()
  await expect(page.getByText('访谈A')).not.toBeVisible()
})

test('20: delete project cascades interviews', async ({ page }) => {
  await createProject(page, PROJECT_NAME)
  for (let i = 0; i < 2; i++) {
    const btn = i === 0 ? '开始第一次访谈' : '新增访谈'
    await page.getByRole('link', { name: btn }).click()
    await page.waitForLoadState('networkidle')
    await page.getByRole('button', { name: '保存访谈' }).click()
    await page.waitForLoadState('networkidle')
  }
  await page.getByRole('button', { name: '删除项目' }).click()
  await page.getByRole('button', { name: '确认删除' }).click()
  await page.waitForLoadState('networkidle')
  await expect(page.locator('.info-value').filter({ hasText: PROJECT_NAME })).not.toBeVisible()
})

test('21: export schemaVersion 2', async ({ page }) => {
  await createProject(page, PROJECT_NAME)
  await page.getByRole('link', { name: '开始第一次访谈' }).click()
  await page.waitForLoadState('networkidle')
  await page.getByRole('button', { name: '保存访谈' }).click()
  await page.waitForLoadState('networkidle')
  const [download] = await Promise.all([
    page.waitForEvent('download', { timeout: 10000 }),
    page.getByRole('button', { name: '导出项目' }).click(),
  ])
  const dlPath = await download.path()
  expect(dlPath).toBeTruthy()
  const data = JSON.parse(fs.readFileSync(dlPath!, 'utf8'))
  expect(data.schemaVersion).toBe(2)
  expect(Array.isArray(data.interviews)).toBe(true)
  expect(data.interviews.length).toBe(1)
})

test('22-23: import v1 empty interviews, import v2 restores interviews', async ({ page }) => {
  // Create v1 backup
  const v1Backup = {
    format: 'memory-cabinet-project' as const,
    schemaVersion: 1,
    appVersion: '0.2.0-alpha.1',
    exportedAt: new Date().toISOString(),
    project: {
      id: 'test-v1', title: 'V1导入测试', description: '', narratorId: 'n1',
      schemaVersion: 1, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    },
    narrator: {
      id: 'n1', projectId: 'test-v1', name: '讲述者', relationshipToInterviewer: '',
      birthYear: null, notes: '', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    },
    consent: {
      id: 'c1', projectId: 'test-v1', consentToRecord: true, consentToStoreQuotes: true,
      consentToStorePhotos: false, consentToFamilyView: true, consentToPublicDisplay: false,
      confirmedAt: new Date().toISOString(), confirmationMethod: '', notes: '',
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    },
  }
  const v1Path = path.join(os.tmpdir(), 'v1-backup-r2c.json')
  fs.writeFileSync(v1Path, JSON.stringify(v1Backup))

  // Import v1
  await page.goto('/#/import')
  await page.waitForLoadState('networkidle')
  await page.locator('input[type="file"]').setInputFiles(v1Path)
  await page.getByRole('button', { name: '开始导入' }).click()
  await expect(page.getByText('导入成功')).toBeVisible()
  await page.getByRole('link', { name: '查看项目' }).click()
  await page.waitForLoadState('networkidle')
  await expect(page.getByRole('heading', { name: 'V1导入测试' })).toBeVisible()
  await expect(page.getByText('暂无访谈记录')).toBeVisible()

  // Create v2 backup with interview
  await clearStorage(page)
  await createProject(page, PROJECT_NAME)
  await page.getByRole('link', { name: '开始第一次访谈' }).click()
  await page.waitForLoadState('networkidle')
  await page.getByRole('button', { name: '保存访谈' }).click()
  await page.waitForLoadState('networkidle')
  const [download] = await Promise.all([
    page.waitForEvent('download', { timeout: 10000 }),
    page.getByRole('button', { name: '导出项目' }).click(),
  ])
  const v2Path = await download.path()

  // Import v2
  await clearStorage(page)
  await page.goto('/#/import')
  await page.waitForLoadState('networkidle')
  await page.locator('input[type="file"]').setInputFiles(v2Path!)
  await page.getByRole('button', { name: '开始导入' }).click()
  await expect(page.getByText('导入成功')).toBeVisible()
  await page.getByRole('link', { name: '查看项目' }).click()
  await page.waitForLoadState('networkidle')
  await expect(page.getByRole('heading', { name: PROJECT_NAME })).toBeVisible()
  await expect(page.getByText('1 次访谈')).toBeVisible()
})

test('24: 390x844 no horizontal scroll', async ({ page }) => {
  await page.setViewportSize(MOBILE_VIEW)
  await createProject(page, PROJECT_NAME)
  const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth)
  const clientWidth = await page.evaluate(() => document.documentElement.clientWidth)
  expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 1)
})

test('25: no external network requests', async ({ page }) => {
  const externalRequests: string[] = []
  page.on('request', (req) => {
    const url = req.url()
    if (!url.startsWith('http://localhost:4173') && !url.startsWith('data:') && !url.startsWith('blob:')) {
      externalRequests.push(url)
    }
  })
  await createProject(page, PROJECT_NAME)
  await page.getByRole('link', { name: '开始第一次访谈' }).click()
  await page.waitForLoadState('networkidle')
  expect(externalRequests).toEqual([])
})

test('26: no blocking console errors', async ({ page }) => {
  const errors: string[] = []
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text())
  })
  await createProject(page, PROJECT_NAME)
  await page.getByRole('link', { name: '开始第一次访谈' }).click()
  await page.waitForLoadState('networkidle')
  await page.getByRole('button', { name: '保存访谈' }).click()
  await page.waitForLoadState('networkidle')
  const filtered = errors.filter((e) => !e.includes('favicon'))
  expect(filtered).toEqual([])
})

test('27: HTML and script text does not execute', async ({ page }) => {
  await createProject(page, PROJECT_NAME)
  const alerts: string[] = []
  page.on('dialog', (dialog) => {
    alerts.push(dialog.message())
    dialog.dismiss()
  })
  await page.getByRole('link', { name: '开始第一次访谈' }).click()
  await page.waitForLoadState('networkidle')
  await page.locator('#interview-title').fill('<script>alert("xss-title")</script>')
  await page.locator('#interview-original-text').click()
  await page.locator('#interview-original-text').fill('<img src=x onerror=alert("xss-img")> <script>alert("xss-script")</script>')
  await page.getByRole('button', { name: '保存访谈' }).click()
  await page.waitForLoadState('networkidle')
  expect(alerts).toEqual([])
  await expect(page.getByText('<script>alert("xss-title")</script>')).toBeVisible()
})