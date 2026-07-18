import { test, expect } from '@playwright/test'

test.describe('v0.2A Basic Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/#/projects')
  })

  test('create a project and view details', async ({ page }) => {
    await page.getByRole('link', { name: '新建项目' }).click()
    await page.locator('#project-title').fill('外婆的裁缝岁月')
    await page.locator('#narrator-name').fill('王秀兰')
    await page.locator('#narrator-rel').fill('外婆')
    await page.locator('#narrator-year').fill('1928')
    await page.getByLabel('同意被记录').check()
    await page.getByLabel('同意保存原话').check()
    await page.getByLabel('允许家庭查看').check()
    await page.getByRole('button', { name: '创建项目' }).click()
    await expect(page.getByRole('heading', { name: '外婆的裁缝岁月' })).toBeVisible()
    await expect(page.getByText('王秀兰')).toBeVisible()
    await expect(page.getByText('外婆', { exact: true })).toBeVisible()
    await expect(page.getByText('1928 年')).toBeVisible()
  })

  test('project persists after refresh', async ({ page }) => {
    await page.getByRole('link', { name: '新建项目' }).click()
    await page.locator('#project-title').fill('持久化测试')
    await page.locator('#narrator-name').fill('测试人')
    await page.getByRole('button', { name: '创建项目' }).click()
    await expect(page.getByRole('heading', { name: '持久化测试' })).toBeVisible()
    await page.reload()
    await page.getByRole('link', { name: '项目列表' }).click()
    await expect(page.getByRole('heading', { name: '持久化测试' })).toBeVisible()
  })

  test('project list shows projects', async ({ page }) => {
    await page.getByRole('link', { name: '新建项目' }).click()
    await page.locator('#project-title').fill('列表测试项目')
    await page.locator('#narrator-name').fill('测试讲述者')
    await page.getByRole('button', { name: '创建项目' }).click()
    await page.getByRole('link', { name: '项目列表' }).click()
    await expect(page.getByText('列表测试项目')).toBeVisible()
  })

  test('project detail shows narrator info', async ({ page }) => {
    await page.getByRole('link', { name: '新建项目' }).click()
    await page.locator('#project-title').fill('讲述者详情测试')
    await page.locator('#narrator-name').fill('李明')
    await page.locator('#narrator-rel').fill('父亲')
    await page.locator('#narrator-year').fill('1955')
    await page.getByRole('button', { name: '创建项目' }).click()
    await expect(page.getByText('李明')).toBeVisible()
    await expect(page.getByText('父亲')).toBeVisible()
    await expect(page.getByText('1955 年')).toBeVisible()
  })

  test('five consent states are correct', async ({ page }) => {
    await page.getByRole('link', { name: '新建项目' }).click()
    await page.locator('#project-title').fill('同意状态测试')
    await page.locator('#narrator-name').fill('测试人')
    await page.getByLabel('同意被记录').check()
    await page.getByLabel('同意保存原话').check()
    await page.getByLabel('允许家庭查看').check()
    await page.getByRole('button', { name: '创建项目' }).click()
    await page.waitForSelector('.consent-badge')
    const yesCount = await page.locator('.consent-badge--yes').count()
    const noCount = await page.locator('.consent-badge--no').count()
    expect(yesCount).toBe(3)
    expect(noCount).toBe(2)
  })

  test('delete project with confirmation', async ({ page }) => {
    await page.getByRole('link', { name: '新建项目' }).click()
    await page.locator('#project-title').fill('待删除项目')
    await page.locator('#narrator-name').fill('删除测试')
    await page.getByRole('button', { name: '创建项目' }).click()
    await expect(page.getByRole('heading', { name: '待删除项目' })).toBeVisible()
    await page.getByRole('button', { name: '删除项目' }).click()
    await expect(page.getByText('确定要删除这个项目吗')).toBeVisible()
    await page.getByRole('button', { name: '确认删除' }).click()
    await expect(page.getByText('待删除项目')).not.toBeVisible()
  })

  test('390x844 no horizontal scroll', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.getByRole('link', { name: '新建项目' }).click()
    await page.locator('#project-title').fill('移动端测试')
    await page.locator('#narrator-name').fill('测试')
    await page.getByRole('button', { name: '创建项目' }).click()
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth)
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth)
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth)
  })

  test('no blocking console errors', async ({ page }) => {
    const errors: string[] = []
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text())
    })
    await page.getByRole('link', { name: '新建项目' }).click()
    await page.locator('#project-title').fill('控制台测试')
    await page.locator('#narrator-name').fill('测试')
    await page.getByRole('button', { name: '创建项目' }).click()
    await expect(page.getByRole('heading', { name: '控制台测试' })).toBeVisible()
    const appErrors = errors.filter(e =>
      !e.includes('Dexie') && !e.includes('indexedDB') && !e.includes('IndexedDB')
    )
    expect(appErrors).toHaveLength(0)
  })
})

test.describe('Import/Export', () => {
  test('export and import as new project', async ({ page }) => {
    await page.goto('/#/projects/new')
    await page.locator('#project-title').fill('导入导出测试')
    await page.locator('#narrator-name').fill('王秀兰')
    await page.locator('#narrator-rel').fill('外婆')
    await page.locator('#narrator-year').fill('1928')
    await page.getByLabel('同意被记录').check()
    await page.getByLabel('同意保存原话').check()
    await page.getByLabel('允许家庭查看').check()
    await page.getByRole('button', { name: '创建项目' }).click()
    const [download] = await Promise.all([
      page.waitForEvent('download', { timeout: 10000 }),
      page.getByRole('button', { name: '导出项目' }).click(),
    ])
    await page.goto('/#/import')
    const downloadPath = await download.path()
    expect(downloadPath).toBeTruthy()
    if (downloadPath) {
      await page.locator('input[type="file"]').setInputFiles(downloadPath)
    }
    await page.getByRole('button', { name: '开始导入' }).click()
    await expect(page.getByText('导入成功')).toBeVisible()
    await page.getByRole('link', { name: '查看项目' }).click()
    await expect(page.getByRole('heading', { name: '导入导出测试（导入副本）' })).toBeVisible()
    await expect(page.getByText('王秀兰')).toBeVisible()
  })

  test('original project still exists after import', async ({ page }) => {
    await page.goto('/#/projects/new')
    await page.locator('#project-title').fill('原项目保留测试')
    await page.locator('#narrator-name').fill('测试人')
    await page.getByRole('button', { name: '创建项目' }).click()
    const [download] = await Promise.all([
      page.waitForEvent('download', { timeout: 10000 }),
      page.getByRole('button', { name: '导出项目' }).click(),
    ])
    await page.goto('/#/import')
    const downloadPath = await download.path()
    if (downloadPath) {
      await page.locator('input[type="file"]').setInputFiles(downloadPath)
    }
    await page.getByRole('button', { name: '开始导入' }).click()
    await expect(page.getByText('导入成功')).toBeVisible()
    await page.goto('/#/projects')
    await expect(page.getByRole('heading', { name: '原项目保留测试', exact: true })).toBeVisible()
    await expect(page.getByRole('heading', { name: '导入导出测试（导入副本）' })).toBeVisible()
  })

  test('delete imported copy', async ({ page }) => {
    await page.goto('/#/projects/new')
    await page.locator('#project-title').fill('删除副本测试')
    await page.locator('#narrator-name').fill('测试人')
    await page.getByRole('button', { name: '创建项目' }).click()
    const [download] = await Promise.all([
      page.waitForEvent('download', { timeout: 10000 }),
      page.getByRole('button', { name: '导出项目' }).click(),
    ])
    await page.goto('/#/import')
    const downloadPath = await download.path()
    if (downloadPath) {
      await page.locator('input[type="file"]').setInputFiles(downloadPath)
    }
    await page.getByRole('button', { name: '开始导入' }).click()
    await page.getByRole('link', { name: '查看项目' }).click()
    await page.getByRole('button', { name: '删除项目' }).click()
    await page.getByRole('button', { name: '确认删除' }).click()
    await page.goto('/#/projects')
    await expect(page.getByText('删除副本测试')).toBeVisible()
    await expect(page.getByRole('heading', { name: '导入导出测试（导入副本）' })).not.toBeVisible()
  })
})

test.describe('Network requests', () => {
  test('no external network requests at runtime', async ({ page }) => {
    const externalRequests: string[] = []
    page.on('request', (request) => {
      const url = request.url()
      if (!url.includes('localhost') && !url.includes('127.0.0.1') && !url.includes('about:') && !url.includes('data:')) {
        externalRequests.push(url)
      }
    })
    await page.goto('/#/projects')
    await page.getByRole('link', { name: '新建项目' }).click()
    await page.locator('#project-title').fill('网络测试')
    await page.locator('#narrator-name').fill('测试')
    await page.getByRole('button', { name: '创建项目' }).click()
    await expect(page.getByRole('heading', { name: '网络测试' })).toBeVisible()
    expect(externalRequests).toHaveLength(0)
  })
})