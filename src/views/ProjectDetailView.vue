<template>
  <div class="page-container">
    <div v-if="loading" class="empty-state">
      <p>加载中...</p>
    </div>

    <div v-else-if="!detail" class="empty-state">
      <p>项目不存在</p>
      <router-link to="/projects" class="btn btn-secondary">返回项目列表</router-link>
    </div>

    <template v-else>
      <nav class="breadcrumb">
        <router-link to="/projects">项目列表</router-link>
        <span>/</span>
        <span>{{ detail.project.title }}</span>
      </nav>

      <h1 class="page-title">{{ detail.project.title }}</h1>

      <!-- Storage Warning -->
      <div class="storage-warning card">
        <p>所有材料目前只保存在此浏览器的本地存储中。清理浏览器数据可能导致项目丢失，请定期导出备份。</p>
      </div>

      <!-- Narrator Info -->
      <section class="card info-section">
        <h2 class="section-title">主要讲述者</h2>
        <div class="info-row">
          <span class="info-label">姓名</span>
          <span class="info-value">{{ detail.narrator.name }}</span>
        </div>
        <div v-if="detail.narrator.relationshipToInterviewer" class="info-row">
          <span class="info-label">关系</span>
          <span class="info-value">{{ detail.narrator.relationshipToInterviewer }}</span>
        </div>
        <div v-if="detail.narrator.birthYear" class="info-row">
          <span class="info-label">出生年份</span>
          <span class="info-value">{{ detail.narrator.birthYear }} 年</span>
        </div>
        <div v-if="detail.narrator.notes" class="info-row">
          <span class="info-label">备注</span>
          <span class="info-value">{{ detail.narrator.notes }}</span>
        </div>
      </section>

      <!-- Consent Status -->
      <section class="card info-section">
        <h2 class="section-title">同意状态</h2>
        <div class="consent-grid">
          <div class="consent-status">
            <span class="info-label">同意记录</span>
            <span :class="['consent-badge', detail.consent.consentToRecord ? 'consent-badge--yes' : 'consent-badge--no']">
              {{ detail.consent.consentToRecord ? '是' : '否' }}
            </span>
          </div>
          <div class="consent-status">
            <span class="info-label">保存原话</span>
            <span :class="['consent-badge', detail.consent.consentToStoreQuotes ? 'consent-badge--yes' : 'consent-badge--no']">
              {{ detail.consent.consentToStoreQuotes ? '是' : '否' }}
            </span>
          </div>
          <div class="consent-status">
            <span class="info-label">保存照片</span>
            <span :class="['consent-badge', detail.consent.consentToStorePhotos ? 'consent-badge--yes' : 'consent-badge--no']">
              {{ detail.consent.consentToStorePhotos ? '是' : '否' }}
            </span>
          </div>
          <div class="consent-status">
            <span class="info-label">家庭查看</span>
            <span :class="['consent-badge', detail.consent.consentToFamilyView ? 'consent-badge--yes' : 'consent-badge--no']">
              {{ detail.consent.consentToFamilyView ? '是' : '否' }}
            </span>
          </div>
          <div class="consent-status">
            <span class="info-label">公开展示</span>
            <span :class="['consent-badge', detail.consent.consentToPublicDisplay ? 'consent-badge--yes' : 'consent-badge--no']">
              {{ detail.consent.consentToPublicDisplay ? '是' : '否' }}
            </span>
          </div>
        </div>
        <div v-if="detail.consent.confirmationMethod" class="info-row" style="margin-top:12px;">
          <span class="info-label">确认方式</span>
          <span class="info-value">{{ detail.consent.confirmationMethod }}</span>
        </div>
        <div v-if="detail.consent.notes" class="info-row">
          <span class="info-label">同意备注</span>
          <span class="info-value">{{ detail.consent.notes }}</span>
        </div>
      </section>

      <!-- Interview Records -->
      <section class="card info-section">
        <div class="section-header">
          <h2 class="section-title">访谈记录</h2>
          <span class="section-count">{{ detail.interviews.length }} 次访谈</span>
        </div>

        <div v-if="detail.interviews.length === 0" class="empty-interviews">
          <p>暂无访谈记录</p>
          <router-link
            :to="{ name: 'interview-create', params: { projectId: detail.project.id } }"
            class="btn btn-primary"
          >开始第一次访谈</router-link>
        </div>

        <div v-else class="interview-list">
          <router-link
            class="interview-list-header"
            :to="{ name: 'interview-create', params: { projectId: detail.project.id } }"
          >
            <span class="btn btn-primary btn-sm">新增访谈</span>
          </router-link>

          <router-link
            v-for="iv in detail.interviews"
            :key="iv.id"
            class="interview-item"
            :to="{ name: 'interview-detail', params: { projectId: detail.project.id, interviewId: iv.id } }"
          >
            <div class="interview-item-main">
              <div class="interview-item-title">{{ iv.title }}</div>
              <div class="interview-item-meta">
                <span>{{ formatDate(iv.interviewDate) }}</span>
                <span v-if="iv.location">· {{ iv.location }}</span>
              </div>
            </div>
            <div class="interview-item-side">
              <div class="interview-item-count">{{ countChars(iv.originalText) }} 字</div>
              <div class="interview-item-time">{{ formatDate(iv.updatedAt) }}</div>
            </div>
          </router-link>
        </div>
      </section>

      <!-- Time Info -->
      
      <section class="card info-section">
        <div class="section-header">
          <h2 class="section-title">记忆卡片</h2>
          <span class="section-count">{{ memoryCounts.total }} 张</span>
        </div>

        <div class="memory-stats">
          <span class="stat-chip stat-chip--draft">草稿 {{ memoryCounts.draft }}</span>
          <span class="stat-chip stat-chip--confirmed">已确认 {{ memoryCounts.confirmed }}</span>
          <span class="stat-chip stat-chip--excluded">已排除 {{ memoryCounts.excluded }}</span>
        </div>

        <router-link
          :to="{ name: 'memory-list', params: { projectId: detail.project.id } }"
          class="btn btn-primary btn-sm memory-view-all"
        >查看全部记忆卡片</router-link>
      </section>

<section class="card info-section">
        <h2 class="section-title">项目信息</h2>
        <div class="info-row">
          <span class="info-label">创建时间</span>
          <span class="info-value">{{ formatDate(detail.project.createdAt) }}</span>
        </div>
        <div class="info-row">
          <span class="info-label">最近更新</span>
          <span class="info-value">{{ formatDate(detail.project.updatedAt) }}</span>
        </div>
      </section>

      <!-- Actions -->
      <div class="action-buttons">
        <button class="btn btn-primary" @click="handleExport">导出项目</button>
        <button class="btn btn-danger" @click="showDeleteConfirm = true">删除项目</button>
      </div>

      <!-- Delete Confirm -->
      <ConfirmDialog
        v-if="showDeleteConfirm"
        title="确认删除"
        message="确定要删除这个项目吗？删除后无法恢复。"
        @confirm="handleDelete"
        @cancel="showDeleteConfirm = false"
      />
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { projectService, type ProjectDetail } from '@/services/project-service'
import { importExportService } from '@/services/import-export-service'
import { memoryItemService } from '@/services/memory-item-service'

import ConfirmDialog from '@/components/ConfirmDialog.vue'

const props = defineProps<{ projectId: string }>()
const router = useRouter()
const route = useRoute()

const loading = ref(true)
const memoryItems = ref<import('@/models/memory-item').MemoryItem[]>([])
const memoryCounts = computed(() => {
  const c = { total: memoryItems.value.length, draft: 0, confirmed: 0, excluded: 0 }
  for (const mi of memoryItems.value) {
    if (mi.reviewStatus === 'draft') c.draft++
    else if (mi.reviewStatus === 'confirmed') c.confirmed++
    else if (mi.reviewStatus === 'excluded') c.excluded++
  }
  return c
})
const detail = ref<ProjectDetail | null>(null)
const showDeleteConfirm = ref(false)

onMounted(async () => {
  const pid = props.projectId || (route.params.projectId as string)
  detail.value = await projectService.getProjectDetail(pid)
  memoryItems.value = await memoryItemService.listByProjectId(pid)
  loading.value = false
})

function formatDate(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString('zh-CN', {
    year: 'numeric', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

function countChars(text: string): number {
  return text ? text.length : 0
}

async function handleExport() {
  if (!detail.value) return
  try {
    await importExportService.exportProject(detail.value.project.id)
  } catch {
    alert('导出失败')
  }
}

async function handleDelete() {
  if (!detail.value) return
  await projectService.deleteProject(detail.value.project.id)
  router.push({ name: 'project-list' })
}
</script>

<style scoped>
.breadcrumb {
  font-size: 13px;
  color: var(--text-muted);
  margin-bottom: 12px;
}

.breadcrumb a {
  color: var(--text-muted);
}

.breadcrumb span {
  margin: 0 6px;
}

.storage-warning {
  background-color: #fff8e1;
  border-color: #ffecb3;
  margin-bottom: 16px;
}

.storage-warning p {
  font-size: 13px;
  color: #f57f17;
  line-height: 1.5;
}

.info-section {
  margin-bottom: 16px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.section-count {
  font-size: 13px;
  color: var(--text-muted);
}

.info-row {
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
  border-bottom: 1px solid var(--border);
}

.info-row:last-child {
  border-bottom: none;
}

.info-label {
  font-size: 14px;
  color: var(--text-muted);
  flex-shrink: 0;
  margin-right: 12px;
}

.info-value {
  font-size: 14px;
  color: var(--text-primary);
  text-align: right;
}

.consent-grid {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.empty-interviews {
  text-align: center;
  padding: 24px 16px;
  color: var(--text-muted);
}

.empty-interviews p {
  margin-bottom: 16px;
}

.interview-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.interview-list-header {
  align-self: flex-end;
  margin-bottom: 4px;
  text-decoration: none;
}

.btn-sm {
  padding: 6px 12px;
  font-size: 13px;
}

.interview-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  border: 1px solid var(--border);
  border-radius: 6px;
  text-decoration: none;
  color: inherit;
  transition: border-color 0.15s;
}

.interview-item:hover {
  border-color: var(--accent, #1976d2);
}

.interview-item-main {
  flex: 1;
  min-width: 0;
}

.interview-item-title {
  font-size: 15px;
  font-weight: 500;
  color: var(--text-primary);
  margin-bottom: 4px;
}

.interview-item-meta {
  font-size: 13px;
  color: var(--text-muted);
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.interview-item-side {
  text-align: right;
  flex-shrink: 0;
  margin-left: 12px;
}

.interview-item-count {
  font-size: 13px;
  color: var(--text-primary);
  margin-bottom: 2px;
}

.interview-item-time {
  font-size: 12px;
  color: var(--text-muted);
}

.action-buttons {
  display: flex;
  gap: 12px;
  justify-content: center;
  padding: 20px 0;
}

.memory-stats {
  display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 12px;
}
.stat-chip {
  padding: 4px 12px; border-radius: 12px; font-size: 13px; font-weight: 500;
}
.stat-chip--draft { background: #fff3e0; color: #e65100; }
.stat-chip--confirmed { background: #e8f5e9; color: #2e7d32; }
.stat-chip--excluded { background: #f5f5f5; color: #616161; }
.memory-view-all { margin-top: 4px; }</style>