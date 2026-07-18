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

      <!-- Time Info -->
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
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { projectService, type ProjectDetail } from '@/services/project-service'
import { importExportService } from '@/services/import-export-service'
import ConfirmDialog from '@/components/ConfirmDialog.vue'

const props = defineProps<{ projectId: string }>()
const router = useRouter()
const route = useRoute()

const loading = ref(true)
const detail = ref<ProjectDetail | null>(null)
const showDeleteConfirm = ref(false)

onMounted(async () => {
  const pid = props.projectId || (route.params.projectId as string)
  detail.value = await projectService.getProjectDetail(pid)
  loading.value = false
})

function formatDate(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString('zh-CN', {
    year: 'numeric', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
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

.action-buttons {
  display: flex;
  gap: 12px;
  justify-content: center;
  padding: 20px 0;
}
</style>
