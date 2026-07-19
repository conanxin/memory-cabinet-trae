<!-- MANUAL_REIMPLEMENTATION_FROM_DOCUMENT_CONTRACT -->
<template>
  <div class="page-container">
    <div v-if="loading" class="empty-state"><p>加载中...</p></div>
    <div v-else-if="!item" class="empty-state">
      <p>记忆卡片不存在</p>
      <router-link to="/projects" class="btn btn-secondary">返回项目列表</router-link>
    </div>
    <template v-else>
      <nav class="breadcrumb">
        <router-link to="/projects">项目列表</router-link>
        <span>/</span>
        <router-link :to="projectLink">{{ project?.title }}</router-link>
        <span>/</span>
        <router-link :to="memoryListLink">记忆卡片</router-link>
        <span>/</span>
        <span>详情</span>
      </nav>

      <div class="page-header">
        <h1 class="page-title">{{ item.title }}</h1>
        <button class="btn btn-danger" @click="showDeleteConfirm = true">删除卡片</button>
      </div>

      <div class="card-tags">
        <span class="tag tag-type">{{ typeLabel(item.type) }}</span>
        <span :class="['tag', 'tag-status--' + item.reviewStatus]">{{ statusLabel(item.reviewStatus) }}</span>
        <span :class="['tag', 'tag-certainty--' + item.certainty]">{{ certaintyLabel(item.certainty) }}</span>
        <span :class="['tag', 'tag-visibility--' + item.visibility]">{{ visibilityLabel(item.visibility) }}</span>
      </div>

      <section class="card info-section">
        <h2 class="section-title">来源信息</h2>
        <div class="info-row"><span class="info-label">所属项目</span><router-link :to="projectLink" class="info-value">{{ project?.title }}</router-link></div>
        <div class="info-row"><span class="info-label">来源访谈</span><router-link :to="interviewLink" class="info-value">{{ interview?.title }}</router-link></div>
        <div class="info-row"><span class="info-label">原文范围</span><span class="info-value">{{ item.sourceStart ?? 'N/A' }} - {{ item.sourceEnd ?? 'N/A' }}</span></div>
        <div class="info-row"><span class="info-label">创建时间</span><span class="info-value">{{ formatDate(item.createdAt) }}</span></div>
        <div class="info-row"><span class="info-label">最近更新</span><span class="info-value">{{ formatDate(item.updatedAt) }}</span></div>
      </section>

      <section class="card evidence-section">
        <h2 class="section-title">原始证据</h2>
        <blockquote class="evidence-text">{{ item.originalText }}</blockquote>
      </section>

      <form class="card form-card" @submit.prevent="handleSave">
        <div class="form-group">
          <label class="form-label">卡片类型</label>
          <select v-model="form.type" class="form-input">
            <option value="event">事件</option>
            <option value="person">人物</option>
            <option value="place">地点</option>
            <option value="object">物品</option>
            <option value="quote">引语</option>
            <option value="theme">主题</option>
          </select>
        </div>

        <div class="form-group">
          <label class="form-label">卡片标题</label>
          <input id="memory-title" v-model="form.title" type="text" class="form-input" required />
        </div>

        <div class="form-group">
          <label class="form-label">人工整理文字</label>
          <textarea id="memory-edited-text" v-model="form.editedText" class="form-textarea" rows="8"></textarea>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label class="form-label">来源类型</label>
            <select v-model="form.sourceType" class="form-input">
              <option value="first_hand">第一手讲述</option>
              <option value="family_retelling">家族转述</option>
              <option value="document">文献记录</option>
              <option value="photo">照片</option>
              <option value="uncertain">不确定</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">确定程度</label>
            <select v-model="form.certainty" class="form-input">
              <option value="certain">确定</option>
              <option value="approximate">大致</option>
              <option value="uncertain">不确定</option>
              <option value="needs_verification">待核实</option>
            </select>
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label class="form-label">可见范围</label>
            <select v-model="form.visibility" class="form-input">
              <option value="private">仅自己</option>
              <option value="family">家庭可见</option>
              <option value="public">公开</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">审阅状态</label>
            <select v-model="form.reviewStatus" class="form-input">
              <option value="draft">草稿</option>
              <option value="confirmed">已确认</option>
              <option value="excluded">已排除</option>
            </select>
          </div>
        </div>

        <div class="form-actions">
          <router-link :to="interviewLink" class="btn btn-secondary">返回访谈</router-link>
          <button type="submit" class="btn btn-primary" :disabled="saving">
            {{ saving ? '保存中...' : '保存修改' }}
          </button>
        </div>
      </form>

      <ConfirmDialog
        v-if="showDeleteConfirm"
        title="删除记忆卡片"
        message="确定要删除这张记忆卡片吗？删除后无法恢复。"
        @confirm="handleDelete"
        @cancel="showDeleteConfirm = false"
      />
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { projectService } from '@/services/project-service'
import { interviewSessionService } from '@/services/interview-session-service'
import { memoryItemService } from '@/services/memory-item-service'
import ConfirmDialog from '@/components/ConfirmDialog.vue'
import type { Project } from '@/models/project'
import type { InterviewSession } from '@/models/interview-session'
import type { MemoryItem, MemoryItemType, SourceType, Certainty, Visibility, ReviewStatus } from '@/models/memory-item'

const router = useRouter()
const route = useRoute()

const loading = ref(true)
const saving = ref(false)
const showDeleteConfirm = ref(false)
const project = ref<Project | null>(null)
const interview = ref<InterviewSession | null>(null)
const item = ref<MemoryItem | null>(null)

const projectId = computed(() => (route.params.projectId as string))
const memoryItemId = computed(() => (route.params.memoryItemId as string))
const projectLink = computed(() => ({ name: 'project-detail' as const, params: { projectId: projectId.value } }))
const memoryListLink = computed(() => ({ name: 'memory-list' as const, params: { projectId: projectId.value } }))
const interviewLink = computed(() => ({ name: 'interview-detail' as const, params: { projectId: projectId.value, interviewId: interview.value?.id ?? '' } }))

const form = ref({
  type: 'event' as MemoryItemType,
  title: '',
  editedText: '',
  sourceType: 'first_hand' as SourceType,
  certainty: 'approximate' as Certainty,
  visibility: 'private' as Visibility,
  reviewStatus: 'draft' as ReviewStatus,
})

const typeLabels: Record<MemoryItemType, string> = { event: '事件', person: '人物', place: '地点', object: '物品', quote: '引语', theme: '主题' }
const statusLabels: Record<ReviewStatus, string> = { draft: '草稿', confirmed: '已确认', excluded: '已排除' }
const certaintyLabels: Record<Certainty, string> = { certain: '确定', approximate: '大致', uncertain: '不确定', needs_verification: '待核实' }
const visibilityLabels: Record<Visibility, string> = { private: '仅自己', family: '家庭可见', public: '公开' }

function typeLabel(t: MemoryItemType) { return typeLabels[t] ?? t }
function statusLabel(s: ReviewStatus) { return statusLabels[s] ?? s }
function certaintyLabel(c: Certainty) { return certaintyLabels[c] ?? c }
function visibilityLabel(v: Visibility) { return visibilityLabels[v] ?? v }
function formatDate(iso: string) {
  const d = new Date(iso)
  return d.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

onMounted(async () => {
  const pid = projectId.value
  const mid = memoryItemId.value

  const p = await projectService.getProjectDetail(pid)
  if (p) project.value = p.project

  const mi = await memoryItemService.getMemoryItem(mid)
  if (mi) {
    item.value = mi
    const iv = await interviewSessionService.getInterview(mi.interviewSessionId)
    if (iv) interview.value = iv
    form.value.type = mi.type
    form.value.title = mi.title
    form.value.editedText = mi.editedText
    form.value.sourceType = mi.sourceType
    form.value.certainty = mi.certainty
    form.value.visibility = mi.visibility
    form.value.reviewStatus = mi.reviewStatus
  }

  loading.value = false
})

async function handleSave() {
  if (!item.value) return
  saving.value = true
  try {
    await memoryItemService.updateMemoryItem(item.value.id, {
      type: form.value.type,
      title: form.value.title,
      editedText: form.value.editedText,
      sourceType: form.value.sourceType,
      certainty: form.value.certainty,
      visibility: form.value.visibility,
      reviewStatus: form.value.reviewStatus,
    })
    router.push({ name: 'memory-list', params: { projectId: projectId.value } })
  } catch (e: unknown) {
    alert('保存失败：' + (e instanceof Error ? e.message : '未知错误'))
  } finally {
    saving.value = false
  }
}

async function handleDelete() {
  if (!item.value) return
  try {
    await memoryItemService.deleteMemoryItem(item.value.id)
    router.push({ name: 'memory-list', params: { projectId: projectId.value } })
  } catch {
    alert('删除失败')
  }
}
</script>

<style scoped>
.breadcrumb { font-size: 13px; color: var(--text-muted); margin-bottom: 12px; }
.breadcrumb a { color: var(--text-muted); }
.breadcrumb span { margin: 0 6px; }

.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; gap: 12px; }

.card-tags { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 16px; }
.tag { padding: 4px 10px; border-radius: 12px; font-size: 12px; font-weight: 500; }
.tag-type { background: #e3f2fd; color: #1565c0; }
.tag-status--draft { background: #fff3e0; color: #e65100; }
.tag-status--confirmed { background: #e8f5e9; color: #2e7d32; }
.tag-status--excluded { background: #f5f5f5; color: #616161; }
.tag-certainty--certain { background: #e8f5e9; color: #2e7d32; }
.tag-certainty--approximate { background: #fff8e1; color: #f57f17; }
.tag-certainty--uncertain { background: #ffebee; color: #c62828; }
.tag-certainty--needs_verification { background: #fce4ec; color: #ad1457; }
.tag-visibility--private { background: #e3f2fd; color: #1565c0; }
.tag-visibility--family { background: #f3e5f5; color: #6a1b9a; }
.tag-visibility--public { background: #e0f2f1; color: #00695c; }

.info-section { margin-bottom: 12px; }
.section-title { font-size: 13px; color: var(--text-muted); margin-bottom: 8px; font-weight: 500; }
.info-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid var(--border); }
.info-row:last-child { border-bottom: none; }
.info-label { font-size: 14px; color: var(--text-muted); }
.info-value { font-size: 14px; color: var(--text-primary); }
.info-value a { color: var(--accent, #1976d2); text-decoration: none; }

.evidence-section { margin-bottom: 16px; }
.evidence-text { padding: 12px 16px; background: #fafafa; border-left: 3px solid var(--accent, #1976d2); margin: 0; font-size: 14px; line-height: 1.6; white-space: pre-wrap; }

.form-card { display: flex; flex-direction: column; gap: 14px; }
.form-group { display: flex; flex-direction: column; gap: 6px; }
.form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
.form-label { font-size: 14px; font-weight: 500; }
.form-input { padding: 10px 12px; border: 1px solid var(--border); border-radius: 4px; font-size: 14px; background: var(--bg-primary); font-family: inherit; }
.form-textarea { padding: 10px 12px; border: 1px solid var(--border); border-radius: 4px; font-size: 14px; background: var(--bg-primary); font-family: inherit; resize: vertical; min-height: 80px; }
.form-actions { display: flex; justify-content: space-between; padding-top: 4px; }

@media (max-width: 480px) { .form-row { grid-template-columns: 1fr; } }
</style>