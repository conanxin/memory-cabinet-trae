<!-- MANUAL_PATCH_FROM_DOCUMENT_CONTRACT: Added memory creation entry, card list, and cascade warning -->
<template>
  <div class="page-container">
    <div v-if="loading" class="empty-state">
      <p>加载中...</p>
    </div>

    <div v-else-if="!project || !interview" class="empty-state">
      <p>{{ !project ? '项目不存在' : '访谈不存在' }}</p>
      <router-link :to="'/projects'" class="btn btn-secondary">返回项目列表</router-link>
    </div>

    <template v-else>
      <nav class="breadcrumb">
        <router-link :to="'/projects'">项目列表</router-link>
        <span>/</span>
        <router-link :to="projectLink">{{ project.title }}</router-link>
        <span>/</span>
        <span>访谈详情</span>
      </nav>

      <div class="page-header">
        <h1 class="page-title">{{ interview.title }}</h1>
        <button class="btn btn-danger" @click="showDeleteConfirm = true">删除本次访谈</button>
      </div>

      <section class="card info-section">
        <h2 class="section-title">时间信息</h2>
        <div class="info-row">
          <span class="info-label">创建时间</span>
          <span class="info-value">{{ formatDate(interview.createdAt) }}</span>
        </div>
        <div class="info-row">
          <span class="info-label">最近更新</span>
          <span class="info-value">{{ formatDate(interview.updatedAt) }}</span>
        </div>
      </section>

      <form class="card form-card" @submit.prevent="handleSave">
        <div class="form-group">
          <label class="form-label">访谈标题 <span class="form-required">*</span></label>
          <input id="interview-title" v-model="form.title" type="text" class="form-input" required />
        </div>

        <div class="form-group">
          <label class="form-label">访谈日期 <span class="form-required">*</span></label>
          <input v-model="form.interviewDate" type="datetime-local" class="form-input" required />
        </div>

        <div class="form-group">
          <label class="form-label">地点</label>
          <input id="interview-location" v-model="form.location" type="text" class="form-input" />
        </div>

        <div class="form-group">
          <label class="form-label">采访者</label>
          <input id="interview-interviewer" v-model="form.interviewerName" type="text" class="form-input" />
        </div>

        <div class="form-group">
          <label class="form-label">原始口述文字</label>
          <textarea id="interview-original-text" ref="originalTextRef" v-model="form.originalText" class="form-textarea" rows="10" @select="updateSelection" @mouseup="updateSelection" @keyup="updateSelection" @click="updateSelection"></textarea>
          <div class="memory-create-bar">
            <span v-if="!hasSelection" class="memory-hint">请先在原始口述中选择一段文字</span>
            <span v-else class="memory-hint selection-hint">已选 {{ selectionLength }} 字</span>
            <button
              type="button"
              class="btn btn-primary btn-sm"
              :disabled="!hasSelection"
              @click="createMemoryFromSelection"
            >从所选原文创建记忆卡片</button>
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">备注</label>
          <textarea id="interview-notes" v-model="form.notes" class="form-textarea" rows="4"></textarea>
        </div>

        <div class="form-actions">
          <router-link :to="projectLink" class="btn btn-secondary">返回项目</router-link>
          <button type="submit" class="btn btn-primary" :disabled="saving">
            {{ saving ? '保存中...' : '保存修改' }}
          </button>
        </div>
      </form>

      <section v-if="memoryItems.length > 0 || !loading" class="card memory-section">
        <div class="section-header">
          <h2 class="section-title">关联记忆卡片</h2>
          <span class="section-count">{{ memoryItems.length }} 张</span>
        </div>
        <div v-if="memoryItems.length === 0" class="empty-memory">
          <p>暂无关联记忆卡片</p>
          <p class="empty-hint">在上方原始口述中选择一段文字，点击"从所选原文创建记忆卡片"</p>
        </div>
        <div v-else class="memory-list">
          <router-link
            v-for="mi in memoryItems"
            :key="mi.id"
            class="memory-item"
            :to="{ name: 'memory-detail', params: { projectId: project!.id, memoryItemId: mi.id } }"
          >
            <div class="memory-item-main">
              <span class="memory-type">{{ typeLabel(mi.type) }}</span>
              <span class="memory-item-title">{{ mi.title }}</span>
            </div>
            <div class="memory-item-side">
              <span :class="['memory-status', 'memory-status--' + mi.reviewStatus]">{{ statusLabel(mi.reviewStatus) }}</span>
              <span class="memory-item-date">{{ formatShortDate(mi.updatedAt) }}</span>
            </div>
          </router-link>
        </div>
      </section>

      <ConfirmDialog
        v-if="showDeleteConfirm"
        title="删除本次访谈"
        :message="deleteMessage"
        @confirm="handleDelete"
        @cancel="showDeleteConfirm = false"
      />
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, nextTick } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { projectService } from '@/services/project-service'
import { interviewSessionService } from '@/services/interview-session-service'
import { memoryItemService } from '@/services/memory-item-service'
import ConfirmDialog from '@/components/ConfirmDialog.vue'
import type { Project } from '@/models/project'
import type { InterviewSession } from '@/models/interview-session'
import type { MemoryItem, MemoryItemType, ReviewStatus } from '@/models/memory-item'

const props = defineProps<{ projectId: string; interviewId: string }>()
const router = useRouter()
const route = useRoute()

const loading = ref(true)
const saving = ref(false)
const showDeleteConfirm = ref(false)
const project = ref<Project | null>(null)
const interview = ref<InterviewSession | null>(null)
const memoryItems = ref<MemoryItem[]>([])
const originalTextRef = ref<HTMLTextAreaElement | null>(null)
const selectionStart = ref(0)
const selectionEnd = ref(0)

const projectLink = computed(() => ({ name: 'project-detail' as const, params: { projectId: props.projectId } }))

const hasSelection = computed(() => selectionStart.value !== selectionEnd.value)
const selectionLength = computed(() => selectionEnd.value - selectionStart.value)

const deleteMessage = computed(() => {
  const count = memoryItems.value.length
  if (count === 0) return '确定要删除本次访谈吗？删除后无法恢复。'
  return "这次访谈关联了 " + count + " 张记忆卡片。删除访谈将同时删除这些卡片，此操作无法撤销。"
})

const typeLabels: Record<MemoryItemType, string> = { event: '事件', person: '人物', place: '地点', object: '物品', quote: '引语', theme: '主题' }
const statusLabels: Record<ReviewStatus, string> = { draft: '草稿', confirmed: '已确认', excluded: '已排除' }

function typeLabel(t: MemoryItemType) { return typeLabels[t] ?? t }
function statusLabel(s: ReviewStatus) { return statusLabels[s] ?? s }

const form = ref({
  title: '',
  interviewDate: '',
  location: '',
  interviewerName: '',
  originalText: '',
  notes: '',
})

function toLocalInput(iso: string): string {
  const d = new Date(iso)
  const tz = d.getTimezoneOffset() * 60000
  return new Date(d.getTime() - tz).toISOString().slice(0, 16)
}

function formatDate(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function formatShortDate(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' })
}

function updateSelection() {
  if (originalTextRef.value) {
    selectionStart.value = originalTextRef.value.selectionStart ?? 0
    selectionEnd.value = originalTextRef.value.selectionEnd ?? 0
  }
}

function createMemoryFromSelection() {
  if (!project.value || !interview.value) return
  updateSelection()
  const s = selectionStart.value
  const e = selectionEnd.value
  if (s === e) return
  router.push({
    name: 'memory-create',
    params: { projectId: props.projectId },
    query: {
      interviewSessionId: interview.value.id,
      sourceStart: String(s),
      sourceEnd: String(e),
    },
  })
}

onMounted(async () => {
  const pid = props.projectId || (route.params.projectId as string)
  const iid = props.interviewId || (route.params.interviewId as string)
  const detail = await projectService.getProjectDetail(pid)
  if (detail) project.value = detail.project
  interview.value = await interviewSessionService.getInterview(iid)
  if (interview.value) {
    form.value.title = interview.value.title
    form.value.interviewDate = toLocalInput(interview.value.interviewDate)
    form.value.location = interview.value.location
    form.value.interviewerName = interview.value.interviewerName
    form.value.originalText = interview.value.originalText
    form.value.notes = interview.value.notes
  }
  memoryItems.value = await memoryItemService.listByInterviewSessionId(iid)
  loading.value = false
  await nextTick()
  updateSelection()
})

async function handleSave() {
  if (!interview.value) return
  saving.value = true
  try {
    const interviewDate = new Date(form.value.interviewDate).toISOString()
    await interviewSessionService.updateInterview(interview.value.id, {
      title: form.value.title,
      interviewDate,
      location: form.value.location,
      interviewerName: form.value.interviewerName,
      originalText: form.value.originalText,
      notes: form.value.notes,
    })
    router.push({ name: 'project-detail', params: { projectId: props.projectId } })
  } catch {
    alert('保存失败')
  } finally {
    saving.value = false
  }
}

async function handleDelete() {
  if (!interview.value) return
  try {
    await interviewSessionService.deleteInterview(interview.value.id)
    router.push({ name: 'project-detail', params: { projectId: props.projectId } })
  } catch {
    alert('删除失败')
  }
}
</script>

<style scoped>
.breadcrumb { font-size: 13px; color: var(--text-muted); margin-bottom: 12px; }
.breadcrumb a { color: var(--text-muted); }
.breadcrumb span { margin: 0 6px; }

.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; gap: 12px; }

.info-section { margin-bottom: 16px; }
.section-title { font-size: 13px; color: var(--text-muted); margin-bottom: 8px; font-weight: 500; }
.info-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid var(--border); }
.info-row:last-child { border-bottom: none; }
.info-label { font-size: 14px; color: var(--text-muted); }
.info-value { font-size: 14px; }

.form-card { display: flex; flex-direction: column; gap: 16px; margin-bottom: 16px; }
.form-group { display: flex; flex-direction: column; gap: 6px; }
.form-label { font-size: 14px; font-weight: 500; }
.form-required { color: #d32f2f; }
.form-input, .form-textarea {
  padding: 10px 12px; border: 1px solid var(--border); border-radius: 4px;
  font-size: 14px; background: var(--bg-primary); font-family: inherit;
}
.form-textarea { resize: vertical; min-height: 80px; }
.form-actions { display: flex; justify-content: space-between; align-items: center; padding-top: 8px; }

.memory-create-bar {
  display: flex; align-items: center; gap: 12px; margin-top: 8px;
  padding: 8px 12px; background: #f5f5f5; border-radius: 4px;
}
.memory-hint { font-size: 13px; color: var(--text-muted); }
.selection-hint { color: #1565c0; }
.btn-sm { padding: 6px 12px; font-size: 13px; }

.memory-section { margin-bottom: 16px; }
.section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
.section-count { font-size: 13px; color: var(--text-muted); }

.empty-memory { padding: 16px; text-align: center; }
.empty-hint { font-size: 13px; color: var(--text-muted); margin-top: 4px; }

.memory-list { display: flex; flex-direction: column; gap: 8px; }
.memory-item {
  display: flex; justify-content: space-between; align-items: center;
  padding: 10px 16px; background: var(--bg-primary);
  border: 1px solid var(--border); border-radius: 8px; text-decoration: none; color: inherit;
}
.memory-item:hover { border-color: var(--accent, #1976d2); }
.memory-item-main { display: flex; align-items: center; gap: 10px; }
.memory-type { font-size: 12px; color: var(--accent, #1976d2); font-weight: 500; }
.memory-item-title { font-size: 14px; font-weight: 500; }
.memory-item-side { display: flex; align-items: center; gap: 12px; }
.memory-status { font-size: 12px; padding: 2px 8px; border-radius: 12px; }
.memory-status--draft { background: #fff3e0; color: #e65100; }
.memory-status--confirmed { background: #e8f5e9; color: #2e7d32; }
.memory-status--excluded { background: #f5f5f5; color: #616161; }
.memory-item-date { font-size: 12px; color: var(--text-muted); }
</style>