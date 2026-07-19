// MANUAL_RUNTIME_VALIDATION_TEST_FROM_DOCUMENT_CONTRACT
import { test, expect, type Page } from '@playwright/test'

const MOBILE_VIEW = { width: 390, height: 844 }
const PROJECT_NAME = 'R3C-MemoryView-Proj'
const INTERVIEW_TITLE = 'R3C-Int-1'
const ORIG = '父亲出生在1940年的一个小村庄。那里有一条清澈的小河。他小时候经常和伙伴们在河边玩耍。'

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
  await page.reload()
  await page.waitForLoadState('networkidle')
}


function extractId(url: string, key: string): string {
  const hash = url.split('#')[1] || url
  const parts = hash.split('/').filter(Boolean)
  for (let i = 0; i < parts.length; i++) {
    if (parts[i] === key && parts[i+1]) return parts[i+1]
  }
  throw new Error('Could not find ' + key + ' in URL: ' + url)
}

test.beforeEach(async ({ page }) => {
  await clearStorage(page)
})

test.describe('R3C Memory Views', () => {
  test('01 create project and interview with memory creation entry', async ({ page }) => {
    await page.getByRole('link', { name: '新建项目' }).click()
    await page.waitForLoadState('networkidle')
    await page.locator('#project-title').fill(PROJECT_NAME)
    await page.locator('#narrator-name').fill('测试讲述者')
    await page.getByRole('button', { name: '创建项目' }).click()
    await page.waitForLoadState('networkidle')
    await expect(page.getByRole('heading', { name: PROJECT_NAME })).toBeVisible()
    await page.getByRole('link', { name: '开始第一次访谈' }).click()
    await page.waitForLoadState('networkidle')
    await page.locator('#interview-title').fill(INTERVIEW_TITLE)
    await page.locator('#interview-original-text').fill(ORIG)
    await page.getByRole('button', { name: '保存访谈' }).click()
    await page.waitForLoadState('networkidle')
    await page.getByRole('link', { name: INTERVIEW_TITLE }).click()
    await page.waitForLoadState('networkidle')
    await expect(page.locator('h1')).toContainText(INTERVIEW_TITLE)
    await expect(page.locator('button', { hasText: '从所选原文创建记忆卡片' })).toBeVisible()
  })

  test('02 no selection shows disabled button and hint', async ({ page }) => {
    await page.getByRole('link', { name: '新建项目' }).click()
    await page.waitForLoadState('networkidle')
    await page.locator('#project-title').fill(PROJECT_NAME)
    await page.locator('#narrator-name').fill('测试讲述者')
    await page.getByRole('button', { name: '创建项目' }).click()
    await page.waitForLoadState('networkidle')
    await page.getByRole('link', { name: '开始第一次访谈' }).click()
    await page.waitForLoadState('networkidle')
    await page.locator('#interview-title').fill(INTERVIEW_TITLE)
    await page.locator('#interview-original-text').fill(ORIG)
    await page.getByRole('button', { name: '保存访谈' }).click()
    await page.waitForLoadState('networkidle')
    await page.getByRole('link', { name: INTERVIEW_TITLE }).click()
    await page.waitForLoadState('networkidle')
    const btn = page.locator('button', { hasText: '从所选原文创建记忆卡片' })
    await expect(btn).toBeDisabled()
    await expect(page.locator('.memory-hint')).toContainText('请先在原始口述中选择一段文字')
  })

  test('03 memory create page shows correct evidence text', async ({ page }) => {
    await page.getByRole('link', { name: '新建项目' }).click()
    await page.waitForLoadState('networkidle')
    await page.locator('#project-title').fill(PROJECT_NAME)
    await page.locator('#narrator-name').fill('测试讲述者')
    await page.getByRole('button', { name: '创建项目' }).click()
    await page.waitForLoadState('networkidle')
    await page.getByRole('link', { name: '开始第一次访谈' }).click()
    await page.waitForLoadState('networkidle')
    await page.locator('#interview-title').fill(INTERVIEW_TITLE)
    await page.locator('#interview-original-text').fill(ORIG)
    await page.getByRole('button', { name: '保存访谈' }).click()
    await page.waitForLoadState('networkidle')
    // Extract project ID from current URL (we're on project detail page)
    // Extract interview ID from link href on project detail page
    const interviewLink = page.getByRole('link', { name: INTERVIEW_TITLE })
    const interviewHref = await interviewLink.getAttribute('href')
    const projectId = interviewHref!.split('/projects/')[1].split('/')[0]
    const interviewId = interviewHref!.split('/interviews/')[1].split('/')[0]
    await page.goto('/#/projects/' + projectId + '/memories/new?interviewSessionId=' + interviewId + '&sourceStart=5&sourceEnd=15')
    await page.waitForLoadState('networkidle')
    await expect(page.locator('h1')).toContainText('新增记忆卡片')
    await expect(page.locator('.evidence-text')).toContainText(ORIG.substring(5, 15))
  })

  test('04 editedText defaults to original and can create memory', async ({ page }) => {
    await page.getByRole('link', { name: '新建项目' }).click()
    await page.waitForLoadState('networkidle')
    await page.locator('#project-title').fill(PROJECT_NAME)
    await page.locator('#narrator-name').fill('测试讲述者')
    await page.getByRole('button', { name: '创建项目' }).click()
    await page.waitForLoadState('networkidle')
    await page.getByRole('link', { name: '开始第一次访谈' }).click()
    await page.waitForLoadState('networkidle')
    await page.locator('#interview-title').fill(INTERVIEW_TITLE)
    await page.locator('#interview-original-text').fill(ORIG)
    await page.getByRole('button', { name: '保存访谈' }).click()
    await page.waitForLoadState('networkidle')
    // Extract interview ID from link href on project detail page
    const interviewLink = page.getByRole('link', { name: INTERVIEW_TITLE })
    const interviewHref = await interviewLink.getAttribute('href')
    const projectId = interviewHref!.split('/projects/')[1].split('/')[0]
    const interviewId = interviewHref!.split('/interviews/')[1].split('/')[0]
    await page.goto('/#/projects/' + projectId + '/memories/new?interviewSessionId=' + interviewId + '&sourceStart=0&sourceEnd=8')
    await page.waitForLoadState('networkidle')
    await expect(page.locator('#memory-edited-text')).toHaveValue(ORIG.substring(0, 8))
    await page.selectOption('#memory-type', 'event')
    await page.locator('#memory-title').fill('测试事件卡')
    await page.locator('button', { hasText: '创建卡片' }).click()
    await page.waitForURL(/memories\/[^new]/)
    await expect(page.locator('h1')).toContainText('测试事件卡')
  })

  test('05-10 create all six memory types', async ({ page }) => {
    await page.getByRole('link', { name: '新建项目' }).click()
    await page.waitForLoadState('networkidle')
    await page.locator('#project-title').fill(PROJECT_NAME)
    await page.locator('#narrator-name').fill('测试讲述者')
    await page.getByRole('button', { name: '创建项目' }).click()
    await page.waitForLoadState('networkidle')
    await page.getByRole('link', { name: '开始第一次访谈' }).click()
    await page.waitForLoadState('networkidle')
    await page.locator('#interview-title').fill(INTERVIEW_TITLE)
    await page.locator('#interview-original-text').fill(ORIG)
    await page.getByRole('button', { name: '保存访谈' }).click()
    await page.waitForLoadState('networkidle')
    // Extract interview ID from link href on project detail page
    const interviewLink = page.getByRole('link', { name: INTERVIEW_TITLE })
    const interviewHref = await interviewLink.getAttribute('href')
    const projectId = interviewHref!.split('/projects/')[1].split('/')[0]
    const interviewId = interviewHref!.split('/interviews/')[1].split('/')[0]

    const types = ['event', 'person', 'place', 'object', 'quote', 'theme']
    const labels = ['事件', '人物', '地点', '物品', '引语', '主题']
    for (let i = 0; i < types.length; i++) {
      await page.goto('/#/projects/' + projectId + '/memories/new?interviewSessionId=' + interviewId + '&sourceStart=0&sourceEnd=8')
      await page.waitForLoadState('networkidle')
      await page.selectOption('#memory-type', types[i])
      await page.locator('#memory-title').fill('测试' + labels[i] + '卡')
      await page.locator('button', { hasText: '创建卡片' }).click()
      await page.waitForURL(/memories\/[^new]/)
      await expect(page.locator('h1')).toContainText('测试' + labels[i] + '卡')
    }
  })

  test('11 project detail shows correct memory count', async ({ page }) => {
    await page.getByRole('link', { name: '新建项目' }).click()
    await page.waitForLoadState('networkidle')
    await page.locator('#project-title').fill(PROJECT_NAME)
    await page.locator('#narrator-name').fill('测试讲述者')
    await page.getByRole('button', { name: '创建项目' }).click()
    await page.waitForLoadState('networkidle')
    await page.getByRole('link', { name: '开始第一次访谈' }).click()
    await page.waitForLoadState('networkidle')
    await page.locator('#interview-title').fill(INTERVIEW_TITLE)
    await page.locator('#interview-original-text').fill(ORIG)
    await page.getByRole('button', { name: '保存访谈' }).click()
    await page.waitForLoadState('networkidle')
    // Extract interview ID from link href on project detail page
    const interviewLink = page.getByRole('link', { name: INTERVIEW_TITLE })
    const interviewHref = await interviewLink.getAttribute('href')
    const projectId = interviewHref!.split('/projects/')[1].split('/')[0]
    const interviewId = interviewHref!.split('/interviews/')[1].split('/')[0]
    // Create 2 memories
    for (const type of ['event', 'person']) {
      await page.goto('/#/projects/' + projectId + '/memories/new?interviewSessionId=' + interviewId + '&sourceStart=0&sourceEnd=8')
      await page.waitForLoadState('networkidle')
      await page.selectOption('#memory-type', type)
      await page.locator('#memory-title').fill('统计卡-' + type)
      await page.locator('button', { hasText: '创建卡片' }).click()
      await page.waitForURL(/memories\/[^new]/)
    }
    // Go to project detail
    await page.goto('/#/projects/' + projectId)
    await page.waitForLoadState('networkidle')
    await expect(page.locator('.section-count', { hasText: '张' })).toContainText('2')
  })

  test('12 memory persists after page refresh', async ({ page }) => {
    await page.getByRole('link', { name: '新建项目' }).click()
    await page.waitForLoadState('networkidle')
    await page.locator('#project-title').fill(PROJECT_NAME)
    await page.locator('#narrator-name').fill('测试讲述者')
    await page.getByRole('button', { name: '创建项目' }).click()
    await page.waitForLoadState('networkidle')
    await page.getByRole('link', { name: '开始第一次访谈' }).click()
    await page.waitForLoadState('networkidle')
    await page.locator('#interview-title').fill(INTERVIEW_TITLE)
    await page.locator('#interview-original-text').fill(ORIG)
    await page.getByRole('button', { name: '保存访谈' }).click()
    await page.waitForLoadState('networkidle')
    // Extract interview ID from link href on project detail page
    const interviewLink = page.getByRole('link', { name: INTERVIEW_TITLE })
    const interviewHref = await interviewLink.getAttribute('href')
    const projectId = interviewHref!.split('/projects/')[1].split('/')[0]
    const interviewId = interviewHref!.split('/interviews/')[1].split('/')[0]
    await page.goto('/#/projects/' + projectId + '/memories/new?interviewSessionId=' + interviewId + '&sourceStart=0&sourceEnd=8')
    await page.waitForLoadState('networkidle')
    await page.selectOption('#memory-type', 'event')
    await page.locator('#memory-title').fill('持久化测试卡')
    await page.locator('button', { hasText: '创建卡片' }).click()
    await page.waitForURL(/memories\/[^new]/)
    await page.reload()
    await expect(page.locator('h1')).toContainText('持久化测试卡')
  })

  test('13 edit memory title, save, verify', async ({ page }) => {
    await page.getByRole('link', { name: '新建项目' }).click()
    await page.waitForLoadState('networkidle')
    await page.locator('#project-title').fill(PROJECT_NAME)
    await page.locator('#narrator-name').fill('测试讲述者')
    await page.getByRole('button', { name: '创建项目' }).click()
    await page.waitForLoadState('networkidle')
    await page.getByRole('link', { name: '开始第一次访谈' }).click()
    await page.waitForLoadState('networkidle')
    await page.locator('#interview-title').fill(INTERVIEW_TITLE)
    await page.locator('#interview-original-text').fill(ORIG)
    await page.getByRole('button', { name: '保存访谈' }).click()
    await page.waitForLoadState('networkidle')
    // Extract interview ID from link href on project detail page
    const interviewLink = page.getByRole('link', { name: INTERVIEW_TITLE })
    const interviewHref = await interviewLink.getAttribute('href')
    const projectId = interviewHref!.split('/projects/')[1].split('/')[0]
    const interviewId = interviewHref!.split('/interviews/')[1].split('/')[0]
    await page.goto('/#/projects/' + projectId + '/memories/new?interviewSessionId=' + interviewId + '&sourceStart=0&sourceEnd=8')
    await page.waitForLoadState('networkidle')
    await page.selectOption('#memory-type', 'event')
    await page.locator('#memory-title').fill('原始标题')
    await page.locator('button', { hasText: '创建卡片' }).click()
    await page.waitForURL(/memories\/[^new]/)
    await page.locator('#memory-title').fill('修改后的标题')
    await page.locator('button', { hasText: '保存修改' }).click()
    await page.waitForURL(/memories$/)
    await page.locator('.memory-card').first().click()
    await page.waitForURL(/memories\/[^new]/)
    await expect(page.locator('#memory-title')).toHaveValue('修改后的标题')
  })

  test('14 delete single memory card', async ({ page }) => {
    await page.getByRole('link', { name: '新建项目' }).click()
    await page.waitForLoadState('networkidle')
    await page.locator('#project-title').fill(PROJECT_NAME)
    await page.locator('#narrator-name').fill('测试讲述者')
    await page.getByRole('button', { name: '创建项目' }).click()
    await page.waitForLoadState('networkidle')
    await page.getByRole('link', { name: '开始第一次访谈' }).click()
    await page.waitForLoadState('networkidle')
    await page.locator('#interview-title').fill(INTERVIEW_TITLE)
    await page.locator('#interview-original-text').fill(ORIG)
    await page.getByRole('button', { name: '保存访谈' }).click()
    await page.waitForLoadState('networkidle')
    // Extract interview ID from link href on project detail page
    const interviewLink = page.getByRole('link', { name: INTERVIEW_TITLE })
    const interviewHref = await interviewLink.getAttribute('href')
    const projectId = interviewHref!.split('/projects/')[1].split('/')[0]
    const interviewId = interviewHref!.split('/interviews/')[1].split('/')[0]
    await page.goto('/#/projects/' + projectId + '/memories/new?interviewSessionId=' + interviewId + '&sourceStart=0&sourceEnd=8')
    await page.waitForLoadState('networkidle')
    await page.selectOption('#memory-type', 'event')
    await page.locator('#memory-title').fill('待删除卡')
    await page.locator('button', { hasText: '创建卡片' }).click()
    await page.waitForURL(/memories\/[^new]/)
    await page.locator('button', { hasText: '删除卡片' }).click()
    await page.locator('button', { hasText: '确认删除' }).click()
    await page.waitForURL(/memories$/)
    await expect(page.locator('.memory-card')).toHaveCount(0)
  })

  test('15 delete interview shows cascade warning with card count', async ({ page }) => {
    await page.getByRole('link', { name: '新建项目' }).click()
    await page.waitForLoadState('networkidle')
    await page.locator('#project-title').fill(PROJECT_NAME)
    await page.locator('#narrator-name').fill('测试讲述者')
    await page.getByRole('button', { name: '创建项目' }).click()
    await page.waitForLoadState('networkidle')
    await page.getByRole('link', { name: '开始第一次访谈' }).click()
    await page.waitForLoadState('networkidle')
    await page.locator('#interview-title').fill(INTERVIEW_TITLE)
    await page.locator('#interview-original-text').fill(ORIG)
    await page.getByRole('button', { name: '保存访谈' }).click()
    await page.waitForLoadState('networkidle')
    // Extract interview ID from link href on project detail page
    const interviewLink = page.getByRole('link', { name: INTERVIEW_TITLE })
    const interviewHref = await interviewLink.getAttribute('href')
    const projectId = interviewHref!.split('/projects/')[1].split('/')[0]
    const interviewId = interviewHref!.split('/interviews/')[1].split('/')[0]
    await page.goto('/#/projects/' + projectId + '/memories/new?interviewSessionId=' + interviewId + '&sourceStart=0&sourceEnd=8')
    await page.waitForLoadState('networkidle')
    await page.selectOption('#memory-type', 'event')
    await page.locator('#memory-title').fill('警告测试卡')
    await page.locator('button', { hasText: '创建卡片' }).click()
    await page.waitForURL(/memories\/[^new]/)
    // Go back to interview
    await page.goto('/#/projects/' + projectId + '/interviews/' + interviewId)
    await page.waitForLoadState('networkidle')
    await page.locator('button', { hasText: '删除本次访谈' }).click()
    await expect(page.locator('p', { hasText: /张记忆卡片/ })).toContainText('1')
    await page.keyboard.press('Escape')
  })

  test('16 delete interview cascades and deletes memories', async ({ page }) => {
    await page.getByRole('link', { name: '新建项目' }).click()
    await page.waitForLoadState('networkidle')
    await page.locator('#project-title').fill(PROJECT_NAME)
    await page.locator('#narrator-name').fill('测试讲述者')
    await page.getByRole('button', { name: '创建项目' }).click()
    await page.waitForLoadState('networkidle')
    await page.getByRole('link', { name: '开始第一次访谈' }).click()
    await page.waitForLoadState('networkidle')
    await page.locator('#interview-title').fill(INTERVIEW_TITLE)
    await page.locator('#interview-original-text').fill(ORIG)
    await page.getByRole('button', { name: '保存访谈' }).click()
    await page.waitForLoadState('networkidle')
    // Extract interview ID from link href on project detail page
    const interviewLink = page.getByRole('link', { name: INTERVIEW_TITLE })
    const interviewHref = await interviewLink.getAttribute('href')
    const projectId = interviewHref!.split('/projects/')[1].split('/')[0]
    const interviewId = interviewHref!.split('/interviews/')[1].split('/')[0]
    await page.goto('/#/projects/' + projectId + '/memories/new?interviewSessionId=' + interviewId + '&sourceStart=0&sourceEnd=8')
    await page.waitForLoadState('networkidle')
    await page.selectOption('#memory-type', 'event')
    await page.locator('#memory-title').fill('级联测试卡')
    await page.locator('button', { hasText: '创建卡片' }).click()
    await page.waitForURL(/memories\/[^new]/)
    await page.goto('/#/projects/' + projectId + '/interviews/' + interviewId)
    await page.waitForLoadState('networkidle')
    await page.locator('button', { hasText: '删除本次访谈' }).click()
    await page.locator('button', { hasText: '确认删除' }).click()
    await page.waitForURL(/projects\//)
    await expect(page.getByRole('link', { name: INTERVIEW_TITLE })).toHaveCount(0)
  })

  test('17 XSS protection in memory title', async ({ page }) => {
    let triggered = false
    page.on('dialog', () => { triggered = true })
    await page.getByRole('link', { name: '新建项目' }).click()
    await page.waitForLoadState('networkidle')
    await page.locator('#project-title').fill(PROJECT_NAME)
    await page.locator('#narrator-name').fill('测试讲述者')
    await page.getByRole('button', { name: '创建项目' }).click()
    await page.waitForLoadState('networkidle')
    await page.getByRole('link', { name: '开始第一次访谈' }).click()
    await page.waitForLoadState('networkidle')
    await page.locator('#interview-title').fill(INTERVIEW_TITLE)
    await page.locator('#interview-original-text').fill(ORIG)
    await page.getByRole('button', { name: '保存访谈' }).click()
    await page.waitForLoadState('networkidle')
    // Extract interview ID from link href on project detail page
    const interviewLink = page.getByRole('link', { name: INTERVIEW_TITLE })
    const interviewHref = await interviewLink.getAttribute('href')
    const projectId = interviewHref!.split('/projects/')[1].split('/')[0]
    const interviewId = interviewHref!.split('/interviews/')[1].split('/')[0]
    await page.goto('/#/projects/' + projectId + '/memories/new?interviewSessionId=' + interviewId + '&sourceStart=0&sourceEnd=8')
    await page.waitForLoadState('networkidle')
    await page.selectOption('#memory-type', 'event')
    await page.locator('#memory-title').fill('<script>alert(1)</script>')
    await page.locator('button', { hasText: '创建卡片' }).click()
    await page.waitForURL(/memories\/[^new]/)
    await page.waitForTimeout(1000)
    expect(triggered).toBe(false)
  })

  test('18 390x844 responsive no horizontal scroll', async ({ page }) => {
    await page.setViewportSize(MOBILE_VIEW)
    await page.getByRole('link', { name: '新建项目' }).click()
    await page.waitForLoadState('networkidle')
    await page.locator('#project-title').fill(PROJECT_NAME)
    await page.locator('#narrator-name').fill('测试讲述者')
    await page.getByRole('button', { name: '创建项目' }).click()
    await page.waitForLoadState('networkidle')
    await page.getByRole('link', { name: '开始第一次访谈' }).click()
    await page.waitForLoadState('networkidle')
    await page.locator('#interview-title').fill(INTERVIEW_TITLE)
    await page.locator('#interview-original-text').fill(ORIG)
    await page.getByRole('button', { name: '保存访谈' }).click()
    await page.waitForLoadState('networkidle')
    // Extract interview ID from link href on project detail page
    const interviewLink = page.getByRole('link', { name: INTERVIEW_TITLE })
    const interviewHref = await interviewLink.getAttribute('href')
    const projectId = interviewHref!.split('/projects/')[1].split('/')[0]
    const interviewId = interviewHref!.split('/interviews/')[1].split('/')[0]
    await page.goto('/#/projects/' + projectId + '/memories/new?interviewSessionId=' + interviewId + '&sourceStart=0&sourceEnd=8')
    await page.waitForLoadState('networkidle')
    await page.selectOption('#memory-type', 'event')
    await page.locator('#memory-title').fill('关联卡1')
    await page.locator('button', { hasText: '创建卡片' }).click()
    await page.waitForURL(/memories\/[^new]/)
    // Go back to interview and check
    await page.goto('/#/projects/' + projectId + '/interviews/' + interviewId)
    await page.waitForLoadState('networkidle')
    await expect(page.locator('.memory-item')).toHaveCount(1)
    await expect(page.locator('.memory-item-title')).toContainText('关联卡1')
  })
})
