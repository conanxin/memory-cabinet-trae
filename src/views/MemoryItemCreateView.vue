<!-- MANUAL_REIMPLEMENTATION_FROM_DOCUMENT_CONTRACT -->
<template>
  <div class="page-container">
    <div v-if="loading" class="empty-state"><p>加载中...</p></div>
    <div v-else-if="!project || !interview" class="empty-state">
      <p>项目或访谈不存在</p>
      <router-link to="/projects" class="btn btn-secondary">返回项目列表</router-link>
    </div>
    <template v-else>
      <nav class="breadcrumb">
        <router-link to="/projects">项目列表</router-link>
        <span>/</span>
        <router-link :to="projectLink">{{ project.title }}</router-link>
        <span>/</span>
        <router-link :to="interviewLink">{{ interview.title }}</router-link>
        <span>/</span>
        <span>新增记忆卡片</span>
      </nav>

      <h1 class="page-title">新增记忆卡片</h1>

      <section class="card info-section">
        <h2 class="section-title">所属项目</h2>
        <p class="info-value">{{ project.title }}</p>
      </section>

      <section class="card info-section">
        <h2 class="section-title">来源访谈</h2>
        <p class="info-value">{{ interview.title }}</p>
      </section>

      <section class="card evidence-section">
        <h2 class="section-title">原始证据文本</h2>
        <p class="evidence-range">第 {{ sourceStart + 1 }}-{{ sourceEnd }} 字（共 {{ sourceEnd - sourceStart }} 字）</p>
        <blockquote class="evidence-text">{{ originalText }}</blockquote>
        <p class="evidence-hint">以上文字从访谈原文中截取，不可在此页面修改。</p>
      </section>

      <form class="card form-card" @submit.prevent="handleSave">
        <div class="form-group">
          <label class="form-label">卡片类型 <span class="form-required">*</span></label>
          <select id="memory-type" v-model="form.type" class="form-input" required>
            <option value="event">事件</option>
            <option value="person">人物</option>
            <option value="place">地点</option>
            <option value="object">物品</option>
            <option value="quote">引语</option>
            <option value="theme">主题</option>
          </select>
        </div>

        <div class="form-group">
          <label class="form-label">卡片标题 <span class="form-required">*</span></label>
          <input id="memory-title" v-model="form.title" type="text" class="form-input" placeholder="例如：父亲的童年" required />
        </div>

        <div class="form-group">
          <label class="form-label">人工整理文字</label>
          <textarea id="memory-edited-text" v-model="form.editedText" class="form-textarea" rows="6" placeholder="对原文进行整理、补充或改写..."></textarea>
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
          <router-link :to="interviewLink" class="btn btn-secondary">取消</router-link>
          <button type="submit" class="btn btn-primary" :disabled="saving">
            {{ saving ? '保存中...' : '创建卡片' }}
          </button>
        </div>
      </form>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { projectService } from '@/services/project-service'
import { interviewSessionService } from '@/services/interview-session-service'
import { memoryItemService } from '@/services/memory-item-service'
import type { Project } from '@/models/project'
import type { InterviewSession } from '@/models/interview-session'
import type { MemoryItemType, SourceType, Certainty, Visibility, ReviewStatus } from '@/models/memory-item'

const router = useRouter()
const route = useRoute()

const loading = ref(true)
const saving = ref(false)
const project = ref<Project | null>(null)
const interview = ref<InterviewSession | null>(null)
const sourceStart = ref(0)
const sourceEnd = ref(0)
const originalText = ref('')

const projectId = computed(() => (route.params.projectId as string))
const projectLink = computed(() => ({ name: 'project-detail' as const, params: { projectId: projectId.value } }))
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

onMounted(async () => {
  const pid = projectId.value
  const iid = route.query.interviewSessionId as string
  const s = parseInt(route.query.sourceStart as string || '0', 10)
  const e = parseInt(route.query.sourceEnd as string || '0', 10)

  const detail = await projectService.getProjectDetail(pid)
  if (detail) project.value = detail.project

  const iv = await interviewSessionService.getInterview(iid)
  if (iv) {
    interview.value = iv
    sourceStart.value = s
    sourceEnd.value = e
    originalText.value = iv.originalText.substring(s, e)
    form.value.editedText = originalText.value
    form.value.title = originalText.value.substring(0, Math.min(30, originalText.value.length))
  }

  loading.value = false
})

async function handleSave() {
  if (!project.value || !interview.value) return
  saving.value = true
  try {
    const mi = await memoryItemService.createMemoryItem({
      projectId: project.value.id,
      interviewSessionId: interview.value.id,
      type: form.value.type,
      title: form.value.title,
      originalText: originalText.value,
      editedText: form.value.editedText,
      sourceStart: sourceStart.value,
      sourceEnd: sourceEnd.value,
      sourceType: form.value.sourceType,
      certainty: form.value.certainty,
      visibility: form.value.visibility,
      reviewStatus: form.value.reviewStatus,
    })
    router.push({ name: 'memory-detail', params: { projectId: project.value!.id, memoryItemId: mi.id } })
  } catch (e: unknown) {
    alert('保存失败：' + (e instanceof Error ? e.message : '未知错误'))
  } finally {
    saving.value = false
  }
}
</script>

<style scoped>
.breadcrumb { font-size: 13px; color: var(--text-muted); margin-bottom: 12px; }
.breadcrumb a { color: var(--text-muted); }
.breadcrumb span { margin: 0 6px; }

.page-title { margin-bottom: 16px; }

.info-section { margin-bottom: 12px; }
.section-title { font-size: 13px; color: var(--text-muted); margin-bottom: 4px; font-weight: 500; }
.info-value { font-size: 15px; }

.evidence-section { margin-bottom: 16px; }
.evidence-range { font-size: 12px; color: var(--text-muted); margin-bottom: 8px; }
.evidence-text {
  padding: 12px 16px; background: #fafafa; border-left: 3px solid var(--accent, #1976d2);
  margin: 0 0 8px; font-size: 14px; line-height: 1.6; white-space: pre-wrap;
}
.evidence-hint { font-size: 12px; color: var(--text-muted); margin: 0; }

.form-card { display: flex; flex-direction: column; gap: 14px; }
.form-group { display: flex; flex-direction: column; gap: 6px; }
.form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
.form-label { font-size: 14px; font-weight: 500; }
.form-required { color: #d32f2f; }
.form-input {
  padding: 10px 12px; border: 1px solid var(--border); border-radius: 4px;
  font-size: 14px; background: var(--bg-primary); font-family: inherit;
}
.form-textarea {
  padding: 10px 12px; border: 1px solid var(--border); border-radius: 4px;
  font-size: 14px; background: var(--bg-primary); font-family: inherit;
  resize: vertical; min-height: 80px;
}
.form-actions { display: flex; justify-content: space-between; padding-top: 4px; }

@media (max-width: 480px) {
  .form-row { grid-template-columns: 1fr; }
}
</style>