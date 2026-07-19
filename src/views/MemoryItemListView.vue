<!-- MANUAL_REIMPLEMENTATION_FROM_DOCUMENT_CONTRACT -->
<template>
  <div class="page-container">
    <div v-if="loading" class="empty-state"><p>加载中...</p></div>
    <div v-else-if="!project" class="empty-state">
      <p>项目不存在</p>
      <router-link to="/projects" class="btn btn-secondary">返回项目列表</router-link>
    </div>
    <template v-else>
      <nav class="breadcrumb">
        <router-link to="/projects">项目列表</router-link>
        <span>/</span>
        <router-link :to="projectLink">{{ project.title }}</router-link>
        <span>/</span>
        <span>记忆卡片</span>
      </nav>

      <div class="page-header">
        <h1 class="page-title">记忆卡片</h1>
        <span class="memory-total">{{ items.length }} 张</span>
      </div>

      <div class="memory-stats card">
        <div class="stat-item">
          <span class="stat-label">草稿</span>
          <span class="stat-value stat-draft">{{ counts.draft }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">已确认</span>
          <span class="stat-value stat-confirmed">{{ counts.confirmed }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">已排除</span>
          <span class="stat-value stat-excluded">{{ counts.excluded }}</span>
        </div>
      </div>

      <div v-if="items.length === 0" class="empty-state card">
        <p>暂无记忆卡片</p>
        <p class="empty-hint">请先在访谈中选择一段原文，然后点击"从所选原文创建记忆卡片"</p>
        <router-link :to="projectLink" class="btn btn-secondary">返回项目</router-link>
      </div>

      <div v-else class="memory-list">
        <router-link
          v-for="mi in items"
          :key="mi.id"
          class="memory-card"
          :to="{ name: 'memory-detail', params: { projectId: project!.id, memoryItemId: mi.id } }"
        >
          <div class="memory-card-header">
            <span class="memory-type">{{ typeLabel(mi.type) }}</span>
            <span :class="['memory-status', 'memory-status--' + mi.reviewStatus]">{{ statusLabel(mi.reviewStatus) }}</span>
          </div>
          <div class="memory-card-title">{{ mi.title }}</div>
          <div class="memory-card-meta">
            <span :class="['memory-certainty', 'memory-certainty--' + mi.certainty]">{{ certaintyLabel(mi.certainty) }}</span>
            <span :class="['memory-visibility', 'memory-visibility--' + mi.visibility]">{{ visibilityLabel(mi.visibility) }}</span>
            <span class="memory-date">{{ formatDate(mi.updatedAt) }}</span>
          </div>
        </router-link>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { projectService } from '@/services/project-service'
import { memoryItemService } from '@/services/memory-item-service'
import type { Project } from '@/models/project'
import type { MemoryItem, MemoryItemType, Certainty, Visibility, ReviewStatus } from '@/models/memory-item'

const route = useRoute()
const loading = ref(true)
const project = ref<Project | null>(null)
const items = ref<MemoryItem[]>([])

const projectId = computed(() => (route.params.projectId as string))
const projectLink = computed(() => ({ name: 'project-detail' as const, params: { projectId: projectId.value } }))

const counts = computed(() => {
  const c = { draft: 0, confirmed: 0, excluded: 0 }
  for (const mi of items.value) {
    if (mi.reviewStatus === 'draft') c.draft++
    else if (mi.reviewStatus === 'confirmed') c.confirmed++
    else if (mi.reviewStatus === 'excluded') c.excluded++
  }
  return c
})

const typeLabels: Record<MemoryItemType, string> = {
  event: '事件', person: '人物', place: '地点',
  object: '物品', quote: '引语', theme: '主题',
}
const statusLabels: Record<ReviewStatus, string> = { draft: '草稿', confirmed: '已确认', excluded: '已排除' }
const certaintyLabels: Record<Certainty, string> = { certain: '确定', approximate: '大致', uncertain: '不确定', needs_verification: '待核实' }
const visibilityLabels: Record<Visibility, string> = { private: '仅自己', family: '家庭可见', public: '公开' }

function typeLabel(t: MemoryItemType) { return typeLabels[t] ?? t }
function statusLabel(s: ReviewStatus) { return statusLabels[s] ?? s }
function certaintyLabel(c: Certainty) { return certaintyLabels[c] ?? c }
function visibilityLabel(v: Visibility) { return visibilityLabels[v] ?? v }
function formatDate(iso: string) {
  const d = new Date(iso)
  return d.toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' })
}

onMounted(async () => {
  const pid = projectId.value
  const detail = await projectService.getProjectDetail(pid)
  if (detail) project.value = detail.project
  items.value = await memoryItemService.listByProjectId(pid)
  loading.value = false
})
</script>

<style scoped>
.breadcrumb { font-size: 13px; color: var(--text-muted); margin-bottom: 12px; }
.breadcrumb a { color: var(--text-muted); }
.breadcrumb span { margin: 0 6px; }

.page-header { display: flex; align-items: center; gap: 12px; margin-bottom: 16px; }
.memory-total { font-size: 14px; color: var(--text-muted); }

.memory-stats { display: flex; gap: 24px; margin-bottom: 16px; padding: 16px; }
.stat-item { display: flex; flex-direction: column; align-items: center; gap: 4px; }
.stat-label { font-size: 12px; color: var(--text-muted); }
.stat-value { font-size: 24px; font-weight: 600; }
.stat-draft { color: #f57c00; }
.stat-confirmed { color: #388e3c; }
.stat-excluded { color: #9e9e9e; }

.empty-state { padding: 32px 16px; text-align: center; }
.empty-hint { font-size: 13px; color: var(--text-muted); margin-top: 8px; }

.memory-list { display: flex; flex-direction: column; gap: 8px; }
.memory-card {
  display: block; padding: 12px 16px; background: var(--bg-primary);
  border: 1px solid var(--border); border-radius: 8px; text-decoration: none;
  color: inherit; transition: border-color 0.15s;
}
.memory-card:hover { border-color: var(--accent, #1976d2); }
.memory-card-header { display: flex; justify-content: space-between; margin-bottom: 6px; }
.memory-type { font-size: 12px; color: var(--accent, #1976d2); font-weight: 500; }
.memory-status { font-size: 12px; padding: 2px 8px; border-radius: 12px; }
.memory-status--draft { background: #fff3e0; color: #e65100; }
.memory-status--confirmed { background: #e8f5e9; color: #2e7d32; }
.memory-status--excluded { background: #f5f5f5; color: #616161; }
.memory-card-title { font-size: 15px; font-weight: 500; margin-bottom: 6px; }
.memory-card-meta { display: flex; gap: 12px; font-size: 12px; color: var(--text-muted); flex-wrap: wrap; }
.memory-date { margin-left: auto; }
</style>