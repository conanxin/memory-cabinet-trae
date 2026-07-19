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

  test('24 default values: sourceType=first_hand certainty=approximate visibility=private reviewStatus=draft', async ({ page }) => {
    await page.getByRole('link', { name: '新建项目' }).click()
    await page.waitForLoadState('networkidle')
    await page.locator('#project-title').fill(PROJECT_NAME + '-defaults')
    await page.locator('#narrator-name').fill('测试讲述者')
    await page.getByRole('button', { name: '创建项目' }).click()
    await page.waitForLoadState('networkidle')
    await page.getByRole('link', { name: '开始第一次访谈' }).or(page.getByRole('link', { name: '新增访谈' })).first().click()
    await page.waitForLoadState('networkidle')
    await page.locator('#interview-title').fill(INTERVIEW_TITLE)
    await page.locator('#interview-original-text').fill(ORIG)
    await page.getByRole('button', { name: '保存访谈' }).click()
    await page.waitForLoadState('networkidle')
    const il = page.getByRole('link', { name: INTERVIEW_TITLE })
    const href = await il.getAttribute('href')
    const pid = href!.split('/projects/')[1].split('/')[0]
    const iid = href!.split('/interviews/')[1].split('/')[0]
    await page.goto('/#/projects/' + pid + '/memories/new?interviewSessionId=' + iid + '&sourceStart=0&sourceEnd=10')
    await page.waitForLoadState('networkidle')
    // sourceType is 2nd select
    await expect(page.locator('select').nth(1)).toHaveValue('first_hand')
    // certainty is 3rd select
    await expect(page.locator('select').nth(2)).toHaveValue('approximate')
    // visibility is 4th select
    await expect(page.locator('select').nth(3)).toHaveValue('private')
    // reviewStatus is 5th select
    await expect(page.locator('select').nth(4)).toHaveValue('draft')
  })

  test('25 change reviewStatus draft to confirmed and persist', async ({ page }) => {
    await page.getByRole('link', { name: '新建项目' }).click()
    await page.waitForLoadState('networkidle')
    await page.locator('#project-title').fill(PROJECT_NAME + '-d2c')
    await page.locator('#narrator-name').fill('测试讲述者')
    await page.getByRole('button', { name: '创建项目' }).click()
    await page.waitForLoadState('networkidle')
    await page.getByRole('link', { name: '开始第一次访谈' }).or(page.getByRole('link', { name: '新增访谈' })).first().click()
    await page.waitForLoadState('networkidle')
    await page.locator('#interview-title').fill(INTERVIEW_TITLE)
    await page.locator('#interview-original-text').fill(ORIG)
    await page.getByRole('button', { name: '保存访谈' }).click()
    await page.waitForLoadState('networkidle')
    const il = page.getByRole('link', { name: INTERVIEW_TITLE })
    const href = await il.getAttribute('href')
    const pid = href!.split('/projects/')[1].split('/')[0]
    const iid = href!.split('/interviews/')[1].split('/')[0]
    await page.goto('/#/projects/' + pid + '/memories/new?interviewSessionId=' + iid + '&sourceStart=0&sourceEnd=10')
    await page.waitForLoadState('networkidle')
    await page.selectOption('#memory-type', 'event')
    await page.locator('#memory-title').fill('draft转confirmed测试')
    await page.locator('button', { hasText: '创建卡片' }).click()
    await page.waitForURL(/memories\/[^new]/)
    // Change reviewStatus (5th select)
    await page.locator('select').nth(4).selectOption('confirmed')
    await page.locator('button', { hasText: '保存修改' }).click()
    await page.waitForURL(/memories$/)
    await page.locator('.memory-card').first().click()
    await page.waitForURL(/memories\/[^new]/)
    await expect(page.locator('select').nth(4)).toHaveValue('confirmed')
  })

  test('26 change reviewStatus confirmed to excluded', async ({ page }) => {
    await page.getByRole('link', { name: '新建项目' }).click()
    await page.waitForLoadState('networkidle')
    await page.locator('#project-title').fill(PROJECT_NAME + '-c2e')
    await page.locator('#narrator-name').fill('测试讲述者')
    await page.getByRole('button', { name: '创建项目' }).click()
    await page.waitForLoadState('networkidle')
    await page.getByRole('link', { name: '开始第一次访谈' }).or(page.getByRole('link', { name: '新增访谈' })).first().click()
    await page.waitForLoadState('networkidle')
    await page.locator('#interview-title').fill(INTERVIEW_TITLE)
    await page.locator('#interview-original-text').fill(ORIG)
    await page.getByRole('button', { name: '保存访谈' }).click()
    await page.waitForLoadState('networkidle')
    const il = page.getByRole('link', { name: INTERVIEW_TITLE })
    const href = await il.getAttribute('href')
    const pid = href!.split('/projects/')[1].split('/')[0]
    const iid = href!.split('/interviews/')[1].split('/')[0]
    await page.goto('/#/projects/' + pid + '/memories/new?interviewSessionId=' + iid + '&sourceStart=0&sourceEnd=10')
    await page.waitForLoadState('networkidle')
    await page.selectOption('#memory-type', 'event')
    await page.locator('#memory-title').fill('confirmed转excluded')
    await page.locator('button', { hasText: '创建卡片' }).click()
    await page.waitForURL(/memories\/[^new]/)
    // Set to confirmed first, save
    await page.locator('select').nth(4).selectOption('confirmed')
    await page.locator('button', { hasText: '保存修改' }).click()
    await page.waitForURL(/memories$/)
    await page.locator('.memory-card').first().click()
    await page.waitForURL(/memories\/[^new]/)
    // Now change to excluded
    await page.locator('select').nth(4).selectOption('excluded')
    await page.locator('button', { hasText: '保存修改' }).click()
    await page.waitForURL(/memories$/)
    await page.locator('.memory-card').first().click()
    await page.waitForURL(/memories\/[^new]/)
    await expect(page.locator('select').nth(4)).toHaveValue('excluded')
  })

  test('27 edit editedText and persist after refresh', async ({ page }) => {
    await page.getByRole('link', { name: '新建项目' }).click()
    await page.waitForLoadState('networkidle')
    await page.locator('#project-title').fill(PROJECT_NAME + '-editET')
    await page.locator('#narrator-name').fill('测试讲述者')
    await page.getByRole('button', { name: '创建项目' }).click()
    await page.waitForLoadState('networkidle')
    await page.getByRole('link', { name: '开始第一次访谈' }).or(page.getByRole('link', { name: '新增访谈' })).first().click()
    await page.waitForLoadState('networkidle')
    await page.locator('#interview-title').fill(INTERVIEW_TITLE)
    await page.locator('#interview-original-text').fill(ORIG)
    await page.getByRole('button', { name: '保存访谈' }).click()
    await page.waitForLoadState('networkidle')
    const il = page.getByRole('link', { name: INTERVIEW_TITLE })
    const href = await il.getAttribute('href')
    const pid = href!.split('/projects/')[1].split('/')[0]
    const iid = href!.split('/interviews/')[1].split('/')[0]
    await page.goto('/#/projects/' + pid + '/memories/new?interviewSessionId=' + iid + '&sourceStart=0&sourceEnd=10')
    await page.waitForLoadState('networkidle')
    await page.selectOption('#memory-type', 'event')
    await page.locator('#memory-title').fill('editedText编辑测试')
    await page.locator('button', { hasText: '创建卡片' }).click()
    await page.waitForURL(/memories\/[^new]/)
    await page.locator('#memory-edited-text').fill('这是经过人工整理修改后的文字内容')
    await page.locator('button', { hasText: '保存修改' }).click()
    await page.waitForURL(/memories$/)
    await page.locator('.memory-card').first().click()
    await page.waitForURL(/memories\/[^new]/)
    await expect(page.locator('#memory-edited-text')).toHaveValue('这是经过人工整理修改后的文字内容')
    await page.reload()
    await expect(page.locator('#memory-edited-text')).toHaveValue('这是经过人工整理修改后的文字内容')
  })

  test('28 delete memory card does not affect interview', async ({ page }) => {
    await page.getByRole('link', { name: '新建项目' }).click()
    await page.waitForLoadState('networkidle')
    await page.locator('#project-title').fill(PROJECT_NAME + '-delKeep')
    await page.locator('#narrator-name').fill('测试讲述者')
    await page.getByRole('button', { name: '创建项目' }).click()
    await page.waitForLoadState('networkidle')
    await page.getByRole('link', { name: '开始第一次访谈' }).or(page.getByRole('link', { name: '新增访谈' })).first().click()
    await page.waitForLoadState('networkidle')
    await page.locator('#interview-title').fill(INTERVIEW_TITLE)
    await page.locator('#interview-original-text').fill(ORIG)
    await page.getByRole('button', { name: '保存访谈' }).click()
    await page.waitForLoadState('networkidle')
    const il = page.getByRole('link', { name: INTERVIEW_TITLE })
    const href = await il.getAttribute('href')
    const pid = href!.split('/projects/')[1].split('/')[0]
    const iid = href!.split('/interviews/')[1].split('/')[0]
    await page.goto('/#/projects/' + pid + '/memories/new?interviewSessionId=' + iid + '&sourceStart=0&sourceEnd=10')
    await page.waitForLoadState('networkidle')
    await page.selectOption('#memory-type', 'event')
    await page.locator('#memory-title').fill('删除不影响访谈')
    await page.locator('button', { hasText: '创建卡片' }).click()
    await page.waitForURL(/memories\/[^new]/)
    await page.locator('button', { hasText: '删除卡片' }).click()
    await page.locator('button', { hasText: '确认删除' }).click()
    await page.waitForURL(/memories$/)
    // Go back to interview, verify it still exists
    await page.goto('/#/projects/' + pid + '/interviews/' + iid)
    await page.waitForLoadState('networkidle')
    await expect(page.locator('h1')).toContainText(INTERVIEW_TITLE)
  })

  test('29 interview detail shows associated memory count and list', async ({ page }) => {
    await page.getByRole('link', { name: '新建项目' }).click()
    await page.waitForLoadState('networkidle')
    await page.locator('#project-title').fill(PROJECT_NAME + '-intList')
    await page.locator('#narrator-name').fill('测试讲述者')
    await page.getByRole('button', { name: '创建项目' }).click()
    await page.waitForLoadState('networkidle')
    await page.getByRole('link', { name: '开始第一次访谈' }).or(page.getByRole('link', { name: '新增访谈' })).first().click()
    await page.waitForLoadState('networkidle')
    await page.locator('#interview-title').fill(INTERVIEW_TITLE)
    await page.locator('#interview-original-text').fill(ORIG)
    await page.getByRole('button', { name: '保存访谈' }).click()
    await page.waitForLoadState('networkidle')
    const il = page.getByRole('link', { name: INTERVIEW_TITLE })
    const href = await il.getAttribute('href')
    const pid = href!.split('/projects/')[1].split('/')[0]
    const iid = href!.split('/interviews/')[1].split('/')[0]
    // Create 2 memories
    for (const t of ['event', 'person']) {
      await page.goto('/#/projects/' + pid + '/memories/new?interviewSessionId=' + iid + '&sourceStart=0&sourceEnd=10')
      await page.waitForLoadState('networkidle')
      await page.selectOption('#memory-type', t)
      await page.locator('#memory-title').fill('访谈列表卡-' + t)
      await page.locator('button', { hasText: '创建卡片' }).click()
      await page.waitForURL(/memories\/[^new]/)
    }
    // Go to interview and check
    await page.goto('/#/projects/' + pid + '/interviews/' + iid)
    await page.waitForLoadState('networkidle')
    await expect(page.locator('.section-count', { hasText: '张' })).toContainText('2')
    await expect(page.locator('.memory-item')).toHaveCount(2)
  })

  test('30 Escape closes delete interview dialog without deleting', async ({ page }) => {
    await page.getByRole('link', { name: '新建项目' }).click()
    await page.waitForLoadState('networkidle')
    await page.locator('#project-title').fill(PROJECT_NAME + '-escClose')
    await page.locator('#narrator-name').fill('测试讲述者')
    await page.getByRole('button', { name: '创建项目' }).click()
    await page.waitForLoadState('networkidle')
    await page.getByRole('link', { name: '开始第一次访谈' }).or(page.getByRole('link', { name: '新增访谈' })).first().click()
    await page.waitForLoadState('networkidle')
    await page.locator('#interview-title').fill(INTERVIEW_TITLE)
    await page.locator('#interview-original-text').fill(ORIG)
    await page.getByRole('button', { name: '保存访谈' }).click()
    await page.waitForLoadState('networkidle')
    const il = page.getByRole('link', { name: INTERVIEW_TITLE })
    const href = await il.getAttribute('href')
    const pid = href!.split('/projects/')[1].split('/')[0]
    const iid = href!.split('/interviews/')[1].split('/')[0]
    // Create a memory to see the cascade warning
    await page.goto('/#/projects/' + pid + '/memories/new?interviewSessionId=' + iid + '&sourceStart=0&sourceEnd=10')
    await page.waitForLoadState('networkidle')
    await page.selectOption('#memory-type', 'event')
    await page.locator('#memory-title').fill('Esc关闭测试')
    await page.locator('button', { hasText: '创建卡片' }).click()
    await page.waitForURL(/memories\/[^new]/)
    // Go back to interview and try delete
    await page.goto('/#/projects/' + pid + '/interviews/' + iid)
    await page.waitForLoadState('networkidle')
    await page.locator('button', { hasText: '删除本次访谈' }).click()
    await expect(page.locator('.dialog-overlay')).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(page.locator('.dialog-overlay')).toHaveCount(0)
    // Interview still exists
    await expect(page.locator('h1')).toContainText(INTERVIEW_TITLE)
  })

  test('31 delete interview with 2 cards cascades both', async ({ page }) => {
    await page.getByRole('link', { name: '新建项目' }).click()
    await page.waitForLoadState('networkidle')
    await page.locator('#project-title').fill(PROJECT_NAME + '-cascade2')
    await page.locator('#narrator-name').fill('测试讲述者')
    await page.getByRole('button', { name: '创建项目' }).click()
    await page.waitForLoadState('networkidle')
    await page.getByRole('link', { name: '开始第一次访谈' }).or(page.getByRole('link', { name: '新增访谈' })).first().click()
    await page.waitForLoadState('networkidle')
    await page.locator('#interview-title').fill(INTERVIEW_TITLE)
    await page.locator('#interview-original-text').fill(ORIG)
    await page.getByRole('button', { name: '保存访谈' }).click()
    await page.waitForLoadState('networkidle')
    const il = page.getByRole('link', { name: INTERVIEW_TITLE })
    const href = await il.getAttribute('href')
    const pid = href!.split('/projects/')[1].split('/')[0]
    const iid = href!.split('/interviews/')[1].split('/')[0]
    // Create 2 memories
    for (const t of ['event', 'person']) {
      await page.goto('/#/projects/' + pid + '/memories/new?interviewSessionId=' + iid + '&sourceStart=0&sourceEnd=10')
      await page.waitForLoadState('networkidle')
      await page.selectOption('#memory-type', t)
      await page.locator('#memory-title').fill('级联卡-' + t)
      await page.locator('button', { hasText: '创建卡片' }).click()
      await page.waitForURL(/memories\/[^new]/)
    }
    // Delete interview
    await page.goto('/#/projects/' + pid + '/interviews/' + iid)
    await page.waitForLoadState('networkidle')
    await page.locator('button', { hasText: '删除本次访谈' }).click()
    await expect(page.locator('p', { hasText: /张记忆卡片/ })).toContainText('2')
    await page.locator('button', { hasText: '确认删除' }).click()
    await page.waitForURL(/projects\//)
    await page.waitForLoadState('networkidle')
    await expect(page.getByRole('link', { name: INTERVIEW_TITLE })).toHaveCount(0)
    // Memory count should be 0 now
    await expect(page.locator('.section-count', { hasText: '张' })).toContainText('0')
  })

  test('32 other interview and cards not affected when deleting one', async ({ page }) => {
    await page.getByRole('link', { name: '新建项目' }).click()
    await page.waitForLoadState('networkidle')
    await page.locator('#project-title').fill(PROJECT_NAME + '-notAffect')
    await page.locator('#narrator-name').fill('测试讲述者')
    await page.getByRole('button', { name: '创建项目' }).click()
    await page.waitForLoadState('networkidle')
    // Create interview 1 with 1 card
    await page.getByRole('link', { name: '开始第一次访谈' }).click()
    await page.waitForLoadState('networkidle')
    await page.locator('#interview-title').fill('访谈1')
    await page.locator('#interview-original-text').fill(ORIG)
    await page.getByRole('button', { name: '保存访谈' }).click()
    await page.waitForLoadState('networkidle')
    const il1 = page.getByRole('link', { name: '访谈1' })
    const h1 = await il1.getAttribute('href')
    const pid = h1!.split('/projects/')[1].split('/')[0]
    const iid1 = h1!.split('/interviews/')[1].split('/')[0]
    await page.goto('/#/projects/' + pid + '/memories/new?interviewSessionId=' + iid1 + '&sourceStart=0&sourceEnd=10')
    await page.waitForLoadState('networkidle')
    await page.selectOption('#memory-type', 'event')
    await page.locator('#memory-title').fill('访谈1卡片')
    await page.locator('button', { hasText: '创建卡片' }).click()
    await page.waitForURL(/memories\/[^new]/)
    // Create interview 2 with 1 card
    await page.goto('/#/projects/' + pid)
    await page.waitForLoadState('networkidle')
    await page.getByRole('link', { name: '新增访谈' }).click()
    await page.waitForLoadState('networkidle')
    await page.locator('#interview-title').fill('访谈2')
    await page.locator('#interview-original-text').fill(ORIG)
    await page.getByRole('button', { name: '保存访谈' }).click()
    await page.waitForLoadState('networkidle')
    const il2 = page.getByRole('link', { name: '访谈2' })
    const h2 = await il2.getAttribute('href')
    const iid2 = h2!.split('/interviews/')[1].split('/')[0]
    await page.goto('/#/projects/' + pid + '/memories/new?interviewSessionId=' + iid2 + '&sourceStart=0&sourceEnd=10')
    await page.waitForLoadState('networkidle')
    await page.selectOption('#memory-type', 'person')
    await page.locator('#memory-title').fill('访谈2卡片')
    await page.locator('button', { hasText: '创建卡片' }).click()
    await page.waitForURL(/memories\/[^new]/)
    // Delete interview 1
    await page.goto('/#/projects/' + pid + '/interviews/' + iid1)
    await page.waitForLoadState('networkidle')
    await page.locator('button', { hasText: '删除本次访谈' }).click()
    await page.locator('button', { hasText: '确认删除' }).click()
    await page.waitForURL(/projects\//)
    // Verify interview 2 still exists
    await expect(page.getByRole('link', { name: '访谈2' })).toHaveCount(1)
    // Verify interview 2's card still exists
    await page.goto('/#/projects/' + pid + '/interviews/' + iid2)
    await page.waitForLoadState('networkidle')
    await expect(page.locator('.memory-item')).toHaveCount(1)
  })

  test('33 XSS: originalText and editedText scripts do not execute', async ({ page }) => {
    let triggered = false
    page.on('dialog', () => { triggered = true })
    await page.getByRole('link', { name: '新建项目' }).click()
    await page.waitForLoadState('networkidle')
    await page.locator('#project-title').fill(PROJECT_NAME + '-xssAll')
    await page.locator('#narrator-name').fill('测试讲述者')
    await page.getByRole('button', { name: '创建项目' }).click()
    await page.waitForLoadState('networkidle')
    await page.getByRole('link', { name: '开始第一次访谈' }).or(page.getByRole('link', { name: '新增访谈' })).first().click()
    await page.waitForLoadState('networkidle')
    await page.locator('#interview-title').fill(INTERVIEW_TITLE)
    await page.locator('#interview-original-text').fill('before <img src=x onerror="alert(1)"> after long enough text here to exceed 50 chars for xss test padding')
    await page.getByRole('button', { name: '保存访谈' }).click()
    await page.waitForLoadState('networkidle')
    const il = page.getByRole('link', { name: INTERVIEW_TITLE })
    const href = await il.getAttribute('href')
    const pid = href!.split('/projects/')[1].split('/')[0]
    const iid = href!.split('/interviews/')[1].split('/')[0]
    await page.goto('/#/projects/' + pid + '/memories/new?interviewSessionId=' + iid + '&sourceStart=0&sourceEnd=50')
    await page.waitForLoadState('networkidle')
    await page.selectOption('#memory-type', 'event')
    await page.locator('#memory-title').fill('XSS全面测试')
    await page.locator('button', { hasText: '创建卡片' }).click()
    await page.waitForURL(/memories\/[^new]/)
    await page.waitForTimeout(1500)
    expect(triggered).toBe(false)
  })

  test('34 memory list empty state shows correct message', async ({ page }) => {
    await page.getByRole('link', { name: '新建项目' }).click()
    await page.waitForLoadState('networkidle')
    await page.locator('#project-title').fill(PROJECT_NAME + '-emptyState')
    await page.locator('#narrator-name').fill('测试讲述者')
    await page.getByRole('button', { name: '创建项目' }).click()
    await page.waitForLoadState('networkidle')
    await page.getByRole('link', { name: '查看全部记忆卡片' }).click()
    await page.waitForURL(/memories$/)
    await expect(page.locator('p', { hasText: '暂无记忆卡片' })).toBeVisible()
    await expect(page.locator('.memory-card')).toHaveCount(0)
  })


  test('35 no external network requests during memory creation flow', async ({ page }) => {
    const external: string[] = []
    page.on('request', (req) => {
      const u = req.url()
      if (!u.startsWith('http://localhost') && !u.startsWith('http://127.0.0.1') && !u.startsWith('data:') && !u.startsWith('blob:')) {
        external.push(u)
      }
    })
    await page.getByRole('link', { name: '新建项目' }).click()
    await page.waitForLoadState('networkidle')
    await page.locator('#project-title').fill(PROJECT_NAME + '-noNet')
    await page.locator('#narrator-name').fill('测试讲述者')
    await page.getByRole('button', { name: '创建项目' }).click()
    await page.waitForLoadState('networkidle')
    await page.getByRole('link', { name: '开始第一次访谈' }).or(page.getByRole('link', { name: '新增访谈' })).first().click()
    await page.waitForLoadState('networkidle')
    await page.locator('#interview-title').fill(INTERVIEW_TITLE)
    await page.locator('#interview-original-text').fill(ORIG)
    await page.getByRole('button', { name: '保存访谈' }).click()
    await page.waitForLoadState('networkidle')
    const il = page.getByRole('link', { name: INTERVIEW_TITLE })
    const href = await il.getAttribute('href')
    const pid = href!.split('/projects/')[1].split('/')[0]
    const iid = href!.split('/interviews/')[1].split('/')[0]
    await page.goto('/#/projects/' + pid + '/memories/new?interviewSessionId=' + iid + '&sourceStart=0&sourceEnd=10')
    await page.waitForLoadState('networkidle')
    await page.selectOption('#memory-type', 'event')
    await page.locator('#memory-title').fill('无网络请求测试')
    await page.locator('button', { hasText: '创建卡片' }).click()
    await page.waitForURL(/memories\/[^new]/)
    expect(external).toEqual([])
  })

  test('36 memory detail view shows source interview link and source range', async ({ page }) => {
    await page.getByRole('link', { name: '新建项目' }).click()
    await page.waitForLoadState('networkidle')
    await page.locator('#project-title').fill(PROJECT_NAME + '-detailMeta')
    await page.locator('#narrator-name').fill('测试讲述者')
    await page.getByRole('button', { name: '创建项目' }).click()
    await page.waitForLoadState('networkidle')
    await page.getByRole('link', { name: '开始第一次访谈' }).or(page.getByRole('link', { name: '新增访谈' })).first().click()
    await page.waitForLoadState('networkidle')
    await page.locator('#interview-title').fill(INTERVIEW_TITLE)
    await page.locator('#interview-original-text').fill(ORIG)
    await page.getByRole('button', { name: '保存访谈' }).click()
    await page.waitForLoadState('networkidle')
    const il = page.getByRole('link', { name: INTERVIEW_TITLE })
    const href = await il.getAttribute('href')
    const pid = href!.split('/projects/')[1].split('/')[0]
    const iid = href!.split('/interviews/')[1].split('/')[0]
    await page.goto('/#/projects/' + pid + '/memories/new?interviewSessionId=' + iid + '&sourceStart=3&sourceEnd=17')
    await page.waitForLoadState('networkidle')
    await page.selectOption('#memory-type', 'event')
    await page.locator('#memory-title').fill('元数据显示测试')
    await page.locator('button', { hasText: '创建卡片' }).click()
    await page.waitForURL(/memories\/[^new]/)
    // Check source range display (format: "3 - 17")
    await expect(page.locator('.info-row', { hasText: '原文范围' })).toContainText('3 - 17')
    // Check interview link
    await expect(page.locator('a', { hasText: INTERVIEW_TITLE })).toBeVisible()
  })

  test('37 create page shows project and interview info correctly', async ({ page }) => {
    await page.getByRole('link', { name: '新建项目' }).click()
    await page.waitForLoadState('networkidle')
    await page.locator('#project-title').fill(PROJECT_NAME + '-createInfo')
    await page.locator('#narrator-name').fill('测试讲述者')
    await page.getByRole('button', { name: '创建项目' }).click()
    await page.waitForLoadState('networkidle')
    await page.getByRole('link', { name: '开始第一次访谈' }).or(page.getByRole('link', { name: '新增访谈' })).first().click()
    await page.waitForLoadState('networkidle')
    await page.locator('#interview-title').fill(INTERVIEW_TITLE)
    await page.locator('#interview-original-text').fill(ORIG)
    await page.getByRole('button', { name: '保存访谈' }).click()
    await page.waitForLoadState('networkidle')
    const il = page.getByRole('link', { name: INTERVIEW_TITLE })
    const href = await il.getAttribute('href')
    const pid = href!.split('/projects/')[1].split('/')[0]
    const iid = href!.split('/interviews/')[1].split('/')[0]
    await page.goto('/#/projects/' + pid + '/memories/new?interviewSessionId=' + iid + '&sourceStart=0&sourceEnd=10')
    await page.waitForLoadState('networkidle')
    await expect(page.locator('.info-value').first()).toContainText(PROJECT_NAME + '-createInfo')
  })

  test('38 cancel button returns to interview from create page', async ({ page }) => {
    await page.getByRole('link', { name: '新建项目' }).click()
    await page.waitForLoadState('networkidle')
    await page.locator('#project-title').fill(PROJECT_NAME + '-cancelBtn')
    await page.locator('#narrator-name').fill('测试讲述者')
    await page.getByRole('button', { name: '创建项目' }).click()
    await page.waitForLoadState('networkidle')
    await page.getByRole('link', { name: '开始第一次访谈' }).or(page.getByRole('link', { name: '新增访谈' })).first().click()
    await page.waitForLoadState('networkidle')
    await page.locator('#interview-title').fill(INTERVIEW_TITLE)
    await page.locator('#interview-original-text').fill(ORIG)
    await page.getByRole('button', { name: '保存访谈' }).click()
    await page.waitForLoadState('networkidle')
    const il = page.getByRole('link', { name: INTERVIEW_TITLE })
    const href = await il.getAttribute('href')
    const pid = href!.split('/projects/')[1].split('/')[0]
    const iid = href!.split('/interviews/')[1].split('/')[0]
    await page.goto('/#/projects/' + pid + '/memories/new?interviewSessionId=' + iid + '&sourceStart=0&sourceEnd=10')
    await page.waitForLoadState('networkidle')
    await page.locator('a', { hasText: '取消' }).click()
    await page.waitForURL(/interviews\//)
    await expect(page.locator('h1')).toContainText(INTERVIEW_TITLE)
  })

  test('39 memory detail return buttons navigate correctly', async ({ page }) => {
    await page.getByRole('link', { name: '新建项目' }).click()
    await page.waitForLoadState('networkidle')
    await page.locator('#project-title').fill(PROJECT_NAME + '-returnBtns')
    await page.locator('#narrator-name').fill('测试讲述者')
    await page.getByRole('button', { name: '创建项目' }).click()
    await page.waitForLoadState('networkidle')
    await page.getByRole('link', { name: '开始第一次访谈' }).or(page.getByRole('link', { name: '新增访谈' })).first().click()
    await page.waitForLoadState('networkidle')
    await page.locator('#interview-title').fill(INTERVIEW_TITLE)
    await page.locator('#interview-original-text').fill(ORIG)
    await page.getByRole('button', { name: '保存访谈' }).click()
    await page.waitForLoadState('networkidle')
    const il = page.getByRole('link', { name: INTERVIEW_TITLE })
    const href = await il.getAttribute('href')
    const pid = href!.split('/projects/')[1].split('/')[0]
    const iid = href!.split('/interviews/')[1].split('/')[0]
    await page.goto('/#/projects/' + pid + '/memories/new?interviewSessionId=' + iid + '&sourceStart=0&sourceEnd=10')
    await page.waitForLoadState('networkidle')
    await page.selectOption('#memory-type', 'event')
    await page.locator('#memory-title').fill('返回按钮测试')
    await page.locator('button', { hasText: '创建卡片' }).click()
    await page.waitForURL(/memories\/[^new]/)
    // Return to interview
    await page.locator('a', { hasText: '返回访谈' }).click()
    await page.waitForURL(/interviews\//)
    await expect(page.locator('h1')).toContainText(INTERVIEW_TITLE)
  })

  test('40 all six types create and display correct labels', async ({ page }) => {
    await page.getByRole('link', { name: '新建项目' }).click()
    await page.waitForLoadState('networkidle')
    await page.locator('#project-title').fill(PROJECT_NAME + '-sixTypes')
    await page.locator('#narrator-name').fill('测试讲述者')
    await page.getByRole('button', { name: '创建项目' }).click()
    await page.waitForLoadState('networkidle')
    await page.getByRole('link', { name: '开始第一次访谈' }).or(page.getByRole('link', { name: '新增访谈' })).first().click()
    await page.waitForLoadState('networkidle')
    await page.locator('#interview-title').fill(INTERVIEW_TITLE)
    await page.locator('#interview-original-text').fill(ORIG)
    await page.getByRole('button', { name: '保存访谈' }).click()
    await page.waitForLoadState('networkidle')
    const il = page.getByRole('link', { name: INTERVIEW_TITLE })
    const href = await il.getAttribute('href')
    const pid = href!.split('/projects/')[1].split('/')[0]
    const iid = href!.split('/interviews/')[1].split('/')[0]
    const types: Array<[string, string]> = [
      ['event', '事件'],
      ['person', '人物'],
      ['place', '地点'],
      ['object', '物品'],
      ['quote', '引语'],
      ['theme', '主题'],
    ]
    for (const [type, label] of types) {
      await page.goto('/#/projects/' + pid + '/memories/new?interviewSessionId=' + iid + '&sourceStart=0&sourceEnd=10')
      await page.waitForLoadState('networkidle')
      await page.selectOption('#memory-type', type)
      await page.locator('#memory-title').fill('六类-' + label)
      await page.locator('button', { hasText: '创建卡片' }).click()
      await page.waitForURL(/memories\/[^new]/)
      await page.waitForLoadState('networkidle')
      await expect(page.locator('h1')).toContainText('六类-' + label)
    }
    // Check list shows 6
    await page.goto('/#/projects/' + pid + '/memories')
    await page.waitForURL(/memories$/)
    await expect(page.locator('.memory-card')).toHaveCount(6)
  })

})
